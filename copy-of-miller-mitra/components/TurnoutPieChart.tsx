import React, { useMemo } from 'react';
import { DailyStockLog } from '../types';

interface TurnoutPieChartProps {
    dailyLogs: DailyStockLog[];
}

interface ChartDataItem {
    name: string;
    value: number;
    percentage: number;
    color: string;
}

const TurnoutPieChart = ({ dailyLogs }: TurnoutPieChartProps): React.ReactElement => {
    
    const chartData = useMemo((): ChartDataItem[] => {
        const totals = dailyLogs.reduce((acc, log) => {
            acc.paddyConsumed += log.paddyConsumedQtls || 0;
            acc.rice += log.riceQuantity || 0;
            acc.husk += log.huskSold || 0;
            acc.bran += log.branSold || 0;
            acc.broken += (log.sortexBrokenSold || 0) + (log.nonSortexBrokenSold || 0);
            acc.murgidana += log.murgidanaSold || 0;
            return acc;
        }, { paddyConsumed: 0, rice: 0, husk: 0, bran: 0, broken: 0, murgidana: 0 });

        if (totals.paddyConsumed <= 0) {
            return [];
        }

        const totalOutput = totals.rice + totals.husk + totals.bran + totals.broken + totals.murgidana;
        const lossOrWip = totals.paddyConsumed - totalOutput;

        const data = [
            { name: 'Rice', value: totals.rice, color: '#f59e0b' },
            { name: 'Husk', value: totals.husk, color: '#854d0e' },
            { name: 'Bran', value: totals.bran, color: '#d97706' },
            { name: 'Broken Rice', value: totals.broken, color: '#fcd34d' },
            { name: 'Murgidana', value: totals.murgidana, color: '#fbbf24' },
            { name: 'WIP / Loss', value: lossOrWip > 0 ? lossOrWip : 0, color: '#9ca3af' },
        ];
        
        return data
            .filter(item => item.value > 0.001) // Only include items with a meaningful value
            .map(item => ({
                ...item,
                percentage: (item.value / totals.paddyConsumed) * 100,
            }));

    }, [dailyLogs]);

    if (chartData.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700">Paddy Turnout Analysis</h3>
                <div className="text-center py-10 text-slate-500">
                    Log some paddy consumption in the Daily Log to see the turnout analysis chart.
                </div>
            </div>
        );
    }
    
    let cumulativePercentage = 0;
    const size = 250;
    const center = size / 2;
    const radius = size / 2 - 20;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-fade-in">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Paddy Turnout Analysis</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                <div className="relative">
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                        {chartData.map((item, index) => {
                            const startAngle = (cumulativePercentage / 100) * 360;
                            const endAngle = ((cumulativePercentage + item.percentage) / 100) * 360;
                            
                            const startX = center + radius * Math.cos(startAngle * Math.PI / 180);
                            const startY = center + radius * Math.sin(startAngle * Math.PI / 180);
                            const endX = center + radius * Math.cos(endAngle * Math.PI / 180);
                            const endY = center + radius * Math.sin(endAngle * Math.PI / 180);
                            
                            const largeArcFlag = item.percentage > 50 ? 1 : 0;
                            
                            const pathData = `M ${center},${center} L ${startX},${startY} A ${radius},${radius} 0 ${largeArcFlag},1 ${endX},${endY} Z`;

                            // Position for label
                            const labelAngle = startAngle + (endAngle - startAngle) / 2;
                            const labelRadius = radius * 0.7;
                            const labelX = center + labelRadius * Math.cos(labelAngle * Math.PI / 180);
                            const labelY = center + labelRadius * Math.sin(labelAngle * Math.PI / 180);
                            
                            cumulativePercentage += item.percentage;
                            
                            return (
                                <g key={index}>
                                    <path d={pathData} fill={item.color} />
                                    {item.percentage > 4 && (
                                       <text
                                            x={labelX}
                                            y={labelY}
                                            fill="white"
                                            fontSize="12"
                                            fontWeight="bold"
                                            textAnchor="middle"
                                            alignmentBaseline="middle"
                                            style={{ pointerEvents: 'none' }}
                                        >
                                            {`${item.percentage.toFixed(0)}%`}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>
                <div className="space-y-2 w-full md:w-64">
                    {chartData.map((item, index) => (
                         <div key={index} className="flex items-center">
                            <span className="w-4 h-4 rounded-sm mr-3 flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                            <span className="text-slate-700 font-medium">{item.name}</span>
                            <span className="ml-auto text-slate-500 font-semibold">{item.percentage.toFixed(2)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TurnoutPieChart;