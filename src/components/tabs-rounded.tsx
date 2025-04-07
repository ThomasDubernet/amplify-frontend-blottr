"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsRoundedProps {
    tabs: string[]
    selectedTab?: string
    onSelect?: (tab: string) => void
    className?: string
}

export function TabsRounded({ 
    tabs, 
    selectedTab, 
    onSelect,
    className 
}: TabsRoundedProps) {
    const [selected, setSelected] = React.useState(selectedTab || tabs[0])

    const handleSelect = (tab: string) => {
        setSelected(tab)
        onSelect?.(tab)
    }

    return (
        <div className="overflow-x-auto no-scrollbar">
            <div className={cn("flex flex-nowrap gap-2 min-w-max", className)}>
                {tabs.map((tab, index) => (
                    <button
                        key={`${tab}-${index}`}
                        onClick={() => handleSelect(tab)}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                            "hover:bg-gray-100",
                            selected === tab
                                ? "bg-gray-900 text-white hover:bg-gray-800"
                                : "bg-white text-gray-700 border border-gray-200"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>
    )
} 