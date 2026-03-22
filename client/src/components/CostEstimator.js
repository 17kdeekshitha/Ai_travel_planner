import React, { useMemo, useState } from 'react';
import '../styles/costestimator.css';

function parseNumeric(value) {
	const numeric = Number(String(value || '').replace(/[^0-9.]/g, ''));
	return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function detectCurrency() {
	return '₹';
}

function parseAmount(value) {
	const parsed = parseFloat(String(value || '').replace(/,/g, ''));
	return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
}

function extractCurrencyAmounts(lineText) {
	const line = String(lineText || '');
	const matches = [];
	const amountRegex = /(?:₹|\bINR\b|\bRs\.?\b)\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\s*(?:-|to)\s*(\d{1,3}(?:,\d{3})+|\d+))?/gi;
	let match;

	while ((match = amountRegex.exec(line)) !== null) {
		const first = parseAmount(match[1]);
		const second = match[2] ? parseAmount(match[2]) : 0;
		if (first <= 0) continue;

		const value = second > 0 ? Math.round((first + second) / 2) : first;
		if (value >= 100) {
			matches.push(value);
		}
	}

	return matches;
}

function extractKeywordLinkedAmounts(lineText) {
	const line = String(lineText || '');
	const values = [];
	const keywordValueRegex = /(cost|budget|subtotal|total|estimate|estimated|expense|spend|amount)\D{0,25}(\d{1,3}(?:,\d{3})+|\d{2,6})/gi;
	const valueKeywordRegex = /(\d{1,3}(?:,\d{3})+|\d{2,6})\D{0,25}(cost|budget|subtotal|total|estimate|estimated|expense|spend|amount)/gi;
	let match;

	while ((match = keywordValueRegex.exec(line)) !== null) {
		const value = parseAmount(match[2]);
		if (value >= 100) values.push(value);
	}

	while ((match = valueKeywordRegex.exec(line)) !== null) {
		const value = parseAmount(match[1]);
		if (value >= 100) values.push(value);
	}

	return values;
}

function extractPerDayCost(planText, totalDays) {
	const lines = String(planText || '').split(/\r?\n/);
	const perDayAmounts = [];
	const daySubtotalAmounts = [];
	const totalTripAmounts = [];
	const amountForDaysValues = [];

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) continue;
		const normalized = line.toLowerCase();
		let amounts = extractCurrencyAmounts(line);

		if (amounts.length === 0 && /(cost|budget|subtotal|total|estimate|estimated|expense|spend|amount|daily|per\s*day)/i.test(line)) {
			amounts = extractKeywordLinkedAmounts(line);
		}

		if (amounts.length === 0) continue;

		if (/(per\s*day|\/\s*day|daily)/i.test(line)) {
			perDayAmounts.push(amounts[0]);
			continue;
		}

		const forDaysMatch = normalized.match(/for\s*(\d+)\s*day/);
		if (forDaysMatch?.[1]) {
			const daysInLine = parseInt(forDaysMatch[1], 10);
			if (Number.isFinite(daysInLine) && daysInLine > 0) {
				amountForDaysValues.push(Math.round(amounts[0] / daysInLine));
				continue;
			}
		}

		if (/(daily\s*subtotal|day\s*\d+\s*(?:subtotal|total)|day\s*\d+.*\bcost\b|daily\s*cost)/i.test(normalized)) {
			daySubtotalAmounts.push(amounts[0]);
			continue;
		}

		if (/(total\s*(?:budget|cost)|overall\s*(?:budget|cost)|trip\s*(?:budget|cost)|estimated\s*(?:budget|cost)|grand\s*total|total\s*estimated\s*trip\s*cost)/i.test(normalized)) {
			totalTripAmounts.push(amounts[0]);
		}
	}

	if (perDayAmounts.length > 0) {
		const total = perDayAmounts.reduce((sum, amount) => sum + amount, 0);
		return Math.round(total / perDayAmounts.length);
	}

	if (daySubtotalAmounts.length > 0) {
		const subtotal = daySubtotalAmounts.reduce((sum, amount) => sum + amount, 0);
		return Math.round(subtotal / daySubtotalAmounts.length);
	}

	if (totalTripAmounts.length > 0 && totalDays > 0) {
		const tripTotal = Math.max(...totalTripAmounts);
		return Math.round(tripTotal / totalDays);
	}

	if (amountForDaysValues.length > 0) {
		const total = amountForDaysValues.reduce((sum, amount) => sum + amount, 0);
		return Math.round(total / amountForDaysValues.length);
	}

	return 0;
}

function formatMoney(value, currency) {
	const amount = Number.isFinite(Number(value)) ? Math.round(Number(value)) : 0;
	return `${currency}${new Intl.NumberFormat('en-IN', {
		maximumFractionDigits: 0
	}).format(amount)}`;
}

function CostEstimator({ destination = '', budget = '', days = 1, plan = '' }) {
	const [travellerCount, setTravellerCount] = useState(1);
	const totalDays = Number(days) > 0 ? Number(days) : 1;

	const estimation = useMemo(() => {
		const budgetValue = parseNumeric(budget);
		const currency = detectCurrency();
		const perDayCost = extractPerDayCost(plan, totalDays);
		const safeTravellerCount = Number(travellerCount) > 0 ? Number(travellerCount) : 1;
		const totalExpectedCost = perDayCost * safeTravellerCount * totalDays;
		const remaining = budgetValue > 0 ? budgetValue - totalExpectedCost : 0;

		return {
			budgetValue,
			currency,
			perDayCost,
			totalExpectedCost,
			safeTravellerCount,
			remaining
		};
	}, [budget, plan, travellerCount, totalDays]);

	if (!plan) {
		return null;
	}

	const {
		budgetValue,
		currency,
		perDayCost,
		totalExpectedCost,
		safeTravellerCount,
		remaining
	} = estimation;

	const statusClass = budgetValue > 0 && totalExpectedCost > budgetValue ? 'over-budget' : 'within-budget';

	return (
		<div className="cost-estimator">
			<div className="estimator-header">
				<h2>Expected Cost Estimator</h2>
				<p>{destination ? `${destination} trip for ${totalDays} day${totalDays > 1 ? 's' : ''}` : 'Trip cost breakdown'}</p>
				<p>Per-day cost is read from your itinerary (INR)</p>
			</div>

			<div className="traveller-input-row">
				<label htmlFor="travellerCount">Number of Travellers</label>
				<input
					id="travellerCount"
					type="number"
					min="1"
					value={travellerCount}
					onChange={(e) => {
						const nextValue = parseInt(e.target.value, 10);
						setTravellerCount(Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 1);
					}}
				/>
			</div>

			<div className={`daily-info ${statusClass}`}>
				<p className="info-text">Total Expected Cost</p>
				<p className="daily-amount">{totalExpectedCost > 0 ? formatMoney(totalExpectedCost, currency) : 'N/A'}</p>
			
			</div>

			<div className="budget-comparison">
				<div className="comparison-row">
					<span className="label">Per-Day Cost (from itinerary)</span>
					<span className="value">{perDayCost > 0 ? formatMoney(perDayCost, currency) : 'Not found'}</span>
				</div>
				<div className="comparison-row">
					<span className="label">Total Expected Cost</span>
					<span className="value">{totalExpectedCost > 0 ? formatMoney(totalExpectedCost, currency) : 'Not available'}</span>
				</div>
				<div className="comparison-row">
					<span className="label">Your Budget</span>
					<span className="value">{budgetValue > 0 ? formatMoney(budgetValue, currency) : 'Not provided'}</span>
				</div>
				{budgetValue > 0 && totalExpectedCost > 0 && (
					<div className={`comparison-row total ${remaining >= 0 ? 'positive' : 'negative'}`}>
						<span className="label">{remaining >= 0 ? 'Estimated Savings' : 'Estimated Overrun'}</span>
						<span className="value">{formatMoney(Math.abs(remaining), currency)}</span>
					</div>
				)}
			</div>

		
		</div>
	);
}

export default CostEstimator;
