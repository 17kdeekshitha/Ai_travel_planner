const Plan = require('../models/Plan');
const axios = require("axios");
const crypto = require('crypto');
require('dotenv').config();

const PROMPT_VERSION = 'detailed-v1';

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const normalizeInterests = (interests) => {
  if (!Array.isArray(interests)) {
    return [];
  }

  return interests
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .sort();
};

const buildInputHash = ({ destination, budget, interests, days }) => {
  const payload = {
    promptVersion: PROMPT_VERSION,
    destination: normalizeText(destination),
    budget: normalizeText(budget),
    interests: normalizeInterests(interests),
    days: Number(days)
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex');
};

const getPlanHash = (planLike) => {
  if (planLike?.inputHash) {
    return planLike.inputHash;
  }

  const interests = Array.isArray(planLike?.interests)
    ? planLike.interests
    : String(planLike?.interests || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  return buildInputHash({
    destination: planLike?.destination,
    budget: planLike?.budget,
    interests,
    days: planLike?.days
  });
};

const generatePlan = async (req, res) => {
  const { destination, budget, interests, days } = req.body;

  console.log("=== Incoming Plan Request ===");
  console.log("Body:", req.body);
  console.log("User Email:", req.email);
  console.log("Using API Key:", process.env.OPENROUTER_API_KEY ? "YES" : "NO");

  if (!destination || !budget || !interests || !days) {
    console.log('Missing required fields');
    return res.status(400).json({ error: 'Missing required fields: destination, budget, interests, or days' });
  }

  const normalizedInterests = Array.isArray(interests)
    ? interests.map((item) => String(item).trim()).filter(Boolean)
    : String(interests)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  const inputHash = buildInputHash({
    destination,
    budget,
    interests: normalizedInterests,
    days
  });

  const recentPlans = await Plan.find({ userEmail: req.email })
    .sort({ createdAt: -1 })
    .limit(200);

  const existingPlan = recentPlans.find((planDoc) => getPlanHash(planDoc) === inputHash);

  if (existingPlan) {
    console.log('Duplicate request detected; returning existing plan');
    return res.json({ plan: existingPlan.response, reused: true });
  }

    const prompt = `You are an expert travel planner.

  Create a detailed ${days}-day itinerary for ${destination} with a total budget of ${budget}.
  Traveler interests: ${normalizedInterests.join(", ")}.

  Requirements:
  1. Provide a clear "Trip Overview" first with destination vibe, best local areas, and budget strategy.
  2. For each day (Day 1 to Day ${days}), include:
    - Morning, Afternoon, Evening, and Night plan with specific places/activities.
    - Short travel logistics between places (approx travel time/mode).
    - Estimated cost line for each part and daily subtotal.
    - Food recommendations (at least 2 options/day, local specialties preferred).
  3. Include practical details:
    - Local transport tips
    - Cultural etiquette/safety notes
    - Best photo spots or hidden gems
  4. End with:
    - Total estimated trip cost breakdown (stay, food, transport, activities, misc)
    - Per-day average spend
    - 5 packing tips specific to destination/weather

  Output format:
  - Use markdown headings and bullet points.
  - Keep it easy to read.
  - Ensure every day has enough detail (not generic one-liners).`;
  console.log('Prompt:', prompt);

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo", 
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",  
          "X-Title": "ai-travel-planner"
        }
      }
    );

    const aiReply = response.data.choices[0].message.content;
    console.log('AI Reply received, length:', aiReply.length);

    await Plan.create({
      userEmail: req.email,  
      destination,
      budget,
      interests: normalizedInterests,
      days,
      response: aiReply,
      inputHash
    });

    console.log('Plan saved to database');
    res.json({ plan: aiReply });

  } catch (error) {
    console.error("--OpenRouter Error --");
    console.error('Error type:', error.constructor.name);

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
      res.status(error.response.status).json({ error: error.response.data.error?.message || 'OpenRouter API error', details: error.response.data });
    } else if (error.request) {
      console.error("No response received from OpenRouter");
      console.error("Request:", error.request);
      res.status(500).json({ error: "No response from OpenRouter API" });
    } else {
      console.error("Message:", error.message);
      res.status(500).json({ error: error.message });
    }
  }
};

const getUserPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ userEmail: req.email })
      .sort({ createdAt: -1 })
      .limit(200);

    const seen = new Set();
    const dedupedPlans = [];

    for (const planDoc of plans) {
      const key = getPlanHash(planDoc);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      dedupedPlans.push(planDoc);

      if (dedupedPlans.length >= 50) {
        break;
      }
    }

    res.json({ plans: dedupedPlans });
  } catch (error) {
    console.error('Failed to fetch user plans:', error.message);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
};

const deleteUserPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPlan = await Plan.findOneAndDelete({
      _id: id,
      userEmail: req.email
    });

    if (!deletedPlan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    return res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user plan:', error.message);
    return res.status(500).json({ error: 'Failed to delete plan' });
  }
};

module.exports = { generatePlan, getUserPlans, deleteUserPlan };
