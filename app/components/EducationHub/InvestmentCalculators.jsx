"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts";

// Calculator types
const calculatorTypes = [
    { id: "sip", name: "SIP Calculator", icon: "📊", description: "Calculate returns on monthly investments" },
    { id: "lumpsum", name: "Lumpsum Calculator", icon: "💰", description: "Calculate returns on one-time investments" },
    { id: "emi", name: "EMI Calculator", icon: "🏦", description: "Calculate loan repayment amounts" },
    { id: "retirement", name: "Retirement Planner", icon: "🎯", description: "Plan for your retirement corpus" },
    { id: "compound", name: "Compound Interest", icon: "📈", description: "See the power of compounding" },
];

export default function InvestmentCalculators() {
    const [activeCalculator, setActiveCalculator] = useState("sip");

    return (
        <div className="space-y-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 mb-3">
                    Investment Calculators
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    Plan your investments with our interactive calculators
                </p>
            </div>

            {/* Calculator Tabs */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
                {calculatorTypes.map(calc => (
                    <button
                        key={calc.id}
                        onClick={() => setActiveCalculator(calc.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeCalculator === calc.id
                                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
                            }`}
                    >
                        <span>{calc.icon}</span>
                        <span>{calc.name}</span>
                    </button>
                ))}
            </div>

            {/* Calculator Content */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
                {activeCalculator === "sip" && <SIPCalculator />}
                {activeCalculator === "lumpsum" && <LumpsumCalculator />}
                {activeCalculator === "emi" && <EMICalculator />}
                {activeCalculator === "retirement" && <RetirementCalculator />}
                {activeCalculator === "compound" && <CompoundInterestCalculator />}
            </div>
        </div>
    );
}

// SIP Calculator
function SIPCalculator() {
    const [monthlyInvestment, setMonthlyInvestment] = useState(10000);
    const [years, setYears] = useState(10);
    const [expectedReturn, setExpectedReturn] = useState(12);

    const results = useMemo(() => {
        const months = years * 12;
        const monthlyRate = expectedReturn / 100 / 12;

        // Future Value formula for SIP
        const futureValue = monthlyInvestment * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
        const totalInvested = monthlyInvestment * months;
        const totalReturns = futureValue - totalInvested;

        // Generate chart data
        const chartData = [];
        let runningValue = 0;
        let runningInvested = 0;
        for (let y = 0; y <= years; y++) {
            const m = y * 12;
            if (m === 0) {
                chartData.push({ year: 0, invested: 0, value: 0 });
            } else {
                runningInvested = monthlyInvestment * m;
                runningValue = monthlyInvestment * (((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) * (1 + monthlyRate));
                chartData.push({
                    year: y,
                    invested: Math.round(runningInvested),
                    value: Math.round(runningValue)
                });
            }
        }

        return { futureValue, totalInvested, totalReturns, chartData };
    }, [monthlyInvestment, years, expectedReturn]);

    return (
        <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
                {/* Inputs */}
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-gray-300 text-sm">Monthly Investment</label>
                            <span className="text-white font-semibold">₹{monthlyInvestment.toLocaleString()}</span>
                        </div>
                        <input
                            type="range"
                            min="500"
                            max="100000"
                            step="500"
                            value={monthlyInvestment}
                            onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>₹500</span>
                            <span>₹1,00,000</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-gray-300 text-sm">Investment Period</label>
                            <span className="text-white font-semibold">{years} Years</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            value={years}
                            onChange={(e) => setYears(Number(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>1 Year</span>
                            <span>30 Years</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-gray-300 text-sm">Expected Annual Return</label>
                            <span className="text-white font-semibold">{expectedReturn}%</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            step="0.5"
                            value={expectedReturn}
                            onChange={(e) => setExpectedReturn(Number(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>1%</span>
                            <span>30%</span>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/20 rounded-xl p-4">
                            <p className="text-gray-400 text-sm">Total Value</p>
                            <p className="text-3xl font-bold text-white">₹{Math.round(results.futureValue).toLocaleString()}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-gray-400 text-xs">Invested Amount</p>
                                <p className="text-lg font-semibold text-gray-200">₹{results.totalInvested.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-gray-400 text-xs">Est. Returns</p>
                                <p className="text-lg font-semibold text-green-400">₹{Math.round(results.totalReturns).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={results.chartData}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="year" stroke="#666" tick={{ fill: '#999', fontSize: 12 }} />
                        <YAxis stroke="#666" tick={{ fill: '#999', fontSize: 12 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                            labelStyle={{ color: '#fff' }}
                            formatter={(value) => [`₹${value.toLocaleString()}`, '']}
                        />
                        <Area type="monotone" dataKey="value" stroke="#22d3ee" fill="url(#colorValue)" name="Total Value" />
                        <Area type="monotone" dataKey="invested" stroke="#6366f1" fill="url(#colorInvested)" name="Invested" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// Lumpsum Calculator
function LumpsumCalculator() {
    const [principal, setPrincipal] = useState(100000);
    const [years, setYears] = useState(10);
    const [expectedReturn, setExpectedReturn] = useState(12);

    const results = useMemo(() => {
        const futureValue = principal * Math.pow(1 + expectedReturn / 100, years);
        const totalReturns = futureValue - principal;

        const chartData = [];
        for (let y = 0; y <= years; y++) {
            chartData.push({
                year: y,
                value: Math.round(principal * Math.pow(1 + expectedReturn / 100, y)),
                principal: principal
            });
        }

        return { futureValue, totalReturns, chartData };
    }, [principal, years, expectedReturn]);

    return (
        <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-gray-300 text-sm">Investment Amount</label>
                            <span className="text-white font-semibold">₹{principal.toLocaleString()}</span>
                        </div>
                        <input
                            type="range"
                            min="10000"
                            max="10000000"
                            step="10000"
                            value={principal}
                            onChange={(e) => setPrincipal(Number(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-gray-300 text-sm">Investment Period</label>
                            <span className="text-white font-semibold">{years} Years</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            value={years}
                            onChange={(e) => setYears(Number(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-gray-300 text-sm">Expected Return</label>
                            <span className="text-white font-semibold">{expectedReturn}%</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            value={expectedReturn}
                            onChange={(e) => setExpectedReturn(Number(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Total Value</p>
                        <p className="text-3xl font-bold text-white">₹{Math.round(results.futureValue).toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-gray-400 text-xs">Principal</p>
                            <p className="text-lg font-semibold text-gray-200">₹{principal.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-gray-400 text-xs">Est. Returns</p>
                            <p className="text-lg font-semibold text-green-400">₹{Math.round(results.totalReturns).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={results.chartData}>
                        <defs>
                            <linearGradient id="colorLumpsum" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="year" stroke="#666" tick={{ fill: '#999', fontSize: 12 }} />
                        <YAxis stroke="#666" tick={{ fill: '#999', fontSize: 12 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                            formatter={(value) => [`₹${value.toLocaleString()}`, '']}
                        />
                        <Area type="monotone" dataKey="value" stroke="#a855f7" fill="url(#colorLumpsum)" name="Total Value" />
                        <Line type="monotone" dataKey="principal" stroke="#666" strokeDasharray="5 5" name="Principal" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// EMI Calculator
function EMICalculator() {
    const [loanAmount, setLoanAmount] = useState(2000000);
    const [tenure, setTenure] = useState(20);
    const [interestRate, setInterestRate] = useState(8.5);

    const results = useMemo(() => {
        const months = tenure * 12;
        const monthlyRate = interestRate / 100 / 12;

        // EMI Formula: [P x R x (1+R)^N] / [(1+R)^N - 1]
        const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
        const totalPayment = emi * months;
        const totalInterest = totalPayment - loanAmount;

        // Amortization for chart
        const chartData = [];
        let balance = loanAmount;
        for (let y = 0; y <= tenure; y += Math.ceil(tenure / 10)) {
            const monthsPassed = y * 12;
            if (y === 0) {
                chartData.push({ year: 0, principal: 0, interest: 0, balance: loanAmount });
            } else {
                let principalPaid = 0;
                let interestPaid = 0;
                let tempBalance = loanAmount;
                for (let m = 1; m <= monthsPassed; m++) {
                    const interestComp = tempBalance * monthlyRate;
                    const principalComp = emi - interestComp;
                    interestPaid += interestComp;
                    principalPaid += principalComp;
                    tempBalance -= principalComp;
                }
                chartData.push({
                    year: y,
                    principal: Math.round(principalPaid),
                    interest: Math.round(interestPaid),
                    balance: Math.max(0, Math.round(tempBalance))
                });
            }
        }

        return { emi, totalPayment, totalInterest, chartData };
    }, [loanAmount, tenure, interestRate]);

    return (
        <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-gray-300 text-sm">Loan Amount</label>
                            <span className="text-white font-semibold">₹{loanAmount.toLocaleString()}</span>
                        </div>
                        <input
                            type="range"
                            min="100000"
                            max="20000000"
                            step="100000"
                            value={loanAmount}
                            onChange={(e) => setLoanAmount(Number(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-gray-300 text-sm">Loan Tenure</label>
                            <span className="text-white font-semibold">{tenure} Years</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            value={tenure}
                            onChange={(e) => setTenure(Number(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-gray-300 text-sm">Interest Rate</label>
                            <span className="text-white font-semibold">{interestRate}%</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="20"
                            step="0.1"
                            value={interestRate}
                            onChange={(e) => setInterestRate(Number(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/20 rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Monthly EMI</p>
                        <p className="text-3xl font-bold text-white">₹{Math.round(results.emi).toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-gray-400 text-xs">Principal</p>
                            <p className="text-lg font-semibold text-gray-200">₹{loanAmount.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-gray-400 text-xs">Total Interest</p>
                            <p className="text-lg font-semibold text-red-400">₹{Math.round(results.totalInterest).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-gray-400 text-xs">Total Payment</p>
                        <p className="text-lg font-semibold text-white">₹{Math.round(results.totalPayment).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Retirement Calculator
function RetirementCalculator() {
    const [currentAge, setCurrentAge] = useState(30);
    const [retirementAge, setRetirementAge] = useState(60);
    const [monthlyExpenses, setMonthlyExpenses] = useState(50000);
    const [currentSavings, setCurrentSavings] = useState(500000);
    const [expectedReturn, setExpectedReturn] = useState(10);
    const [inflation, setInflation] = useState(6);

    const results = useMemo(() => {
        const yearsToRetirement = retirementAge - currentAge;
        const yearsInRetirement = 25; // Assume 25 years post-retirement

        // Future monthly expenses (inflation adjusted)
        const futureMonthlyExpenses = monthlyExpenses * Math.pow(1 + inflation / 100, yearsToRetirement);

        // Corpus needed at retirement (considering inflation during retirement)
        const realReturn = ((1 + expectedReturn / 100) / (1 + inflation / 100)) - 1;
        const corpusNeeded = futureMonthlyExpenses * 12 * ((1 - Math.pow(1 + realReturn, -yearsInRetirement)) / realReturn);

        // Future value of current savings
        const futureSavings = currentSavings * Math.pow(1 + expectedReturn / 100, yearsToRetirement);

        // Gap to fill
        const gap = corpusNeeded - futureSavings;

        // Monthly SIP needed
        const monthlyRate = expectedReturn / 100 / 12;
        const months = yearsToRetirement * 12;
        const monthlyInvestment = gap > 0
            ? (gap * monthlyRate) / ((Math.pow(1 + monthlyRate, months) - 1) * (1 + monthlyRate))
            : 0;

        return {
            corpusNeeded: Math.round(corpusNeeded),
            futureSavings: Math.round(futureSavings),
            futureMonthlyExpenses: Math.round(futureMonthlyExpenses),
            gap: Math.round(gap),
            monthlyInvestment: Math.round(Math.max(0, monthlyInvestment))
        };
    }, [currentAge, retirementAge, monthlyExpenses, currentSavings, expectedReturn, inflation]);

    return (
        <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-5">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-gray-300 text-sm">Current Age</label>
                            <span className="text-white font-semibold">{currentAge} years</span>
                        </div>
                        <input
                            type="range"
                            min="20"
                            max="55"
                            value={currentAge}
                            onChange={(e) => setCurrentAge(Number(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-gray-300 text-sm">Retirement Age</label>
                            <span className="text-white font-semibold">{retirementAge} years</span>
                        </div>
                        <input
                            type="range"
                            min={currentAge + 5}
                            max="70"
                            value={retirementAge}
                            onChange={(e) => setRetirementAge(Number(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-gray-300 text-sm">Current Monthly Expenses</label>
                            <span className="text-white font-semibold">₹{monthlyExpenses.toLocaleString()}</span>
                        </div>
                        <input
                            type="range"
                            min="20000"
                            max="500000"
                            step="5000"
                            value={monthlyExpenses}
                            onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-gray-300 text-sm">Current Savings</label>
                            <span className="text-white font-semibold">₹{currentSavings.toLocaleString()}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="10000000"
                            step="100000"
                            value={currentSavings}
                            onChange={(e) => setCurrentSavings(Number(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/20 rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Required Retirement Corpus</p>
                        <p className="text-3xl font-bold text-white">₹{results.corpusNeeded.toLocaleString()}</p>
                    </div>

                    <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/20 rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Monthly Investment Needed</p>
                        <p className="text-2xl font-bold text-cyan-400">₹{results.monthlyInvestment.toLocaleString()}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-gray-500 text-xs">Future Monthly Expenses</p>
                            <p className="text-white font-medium">₹{results.futureMonthlyExpenses.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-gray-500 text-xs">Years to Retirement</p>
                            <p className="text-white font-medium">{retirementAge - currentAge} years</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Compound Interest Calculator
function CompoundInterestCalculator() {
    const [principal, setPrincipal] = useState(100000);
    const [rate, setRate] = useState(10);
    const [time, setTime] = useState(10);
    const [frequency, setFrequency] = useState(12); // Monthly

    const results = useMemo(() => {
        const n = frequency;
        const r = rate / 100;
        const t = time;

        const amount = principal * Math.pow(1 + r / n, n * t);
        const interest = amount - principal;

        const chartData = [];
        for (let y = 0; y <= time; y++) {
            const yearAmount = principal * Math.pow(1 + r / n, n * y);
            chartData.push({
                year: y,
                simple: principal + (principal * r * y),
                compound: Math.round(yearAmount)
            });
        }

        return { amount, interest, chartData };
    }, [principal, rate, time, frequency]);

    const frequencies = [
        { value: 1, label: "Annually" },
        { value: 4, label: "Quarterly" },
        { value: 12, label: "Monthly" },
        { value: 365, label: "Daily" },
    ];

    return (
        <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-gray-300 text-sm">Principal Amount</label>
                            <span className="text-white font-semibold">₹{principal.toLocaleString()}</span>
                        </div>
                        <input
                            type="range"
                            min="10000"
                            max="5000000"
                            step="10000"
                            value={principal}
                            onChange={(e) => setPrincipal(Number(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-gray-300 text-sm">Interest Rate</label>
                            <span className="text-white font-semibold">{rate}%</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="25"
                            step="0.5"
                            value={rate}
                            onChange={(e) => setRate(Number(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-gray-300 text-sm">Time Period</label>
                            <span className="text-white font-semibold">{time} Years</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            value={time}
                            onChange={(e) => setTime(Number(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                    </div>

                    <div>
                        <label className="text-gray-300 text-sm block mb-2">Compounding Frequency</label>
                        <div className="flex gap-2 flex-wrap">
                            {frequencies.map(f => (
                                <button
                                    key={f.value}
                                    onClick={() => setFrequency(f.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${frequency === f.value
                                            ? "bg-pink-500 text-white"
                                            : "bg-white/10 text-gray-400 hover:bg-white/20"
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-gradient-to-r from-pink-900/30 to-rose-900/30 border border-pink-500/20 rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Total Amount</p>
                        <p className="text-3xl font-bold text-white">₹{Math.round(results.amount).toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-gray-400 text-xs">Principal</p>
                            <p className="text-lg font-semibold text-gray-200">₹{principal.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-gray-400 text-xs">Interest Earned</p>
                            <p className="text-lg font-semibold text-green-400">₹{Math.round(results.interest).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={results.chartData}>
                        <defs>
                            <linearGradient id="colorCompound" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="year" stroke="#666" tick={{ fill: '#999', fontSize: 12 }} />
                        <YAxis stroke="#666" tick={{ fill: '#999', fontSize: 12 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                            formatter={(value) => [`₹${value.toLocaleString()}`, '']}
                        />
                        <Area type="monotone" dataKey="compound" stroke="#ec4899" fill="url(#colorCompound)" name="Compound Interest" />
                        <Line type="monotone" dataKey="simple" stroke="#666" strokeDasharray="5 5" name="Simple Interest" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="text-center text-sm text-gray-500">
                <span className="text-pink-400">—</span> Compound Interest vs <span className="text-gray-400">- - -</span> Simple Interest
            </div>
        </div>
    );
}
