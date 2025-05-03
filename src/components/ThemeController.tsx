'use client'

import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export default function ThemeController() {
    const [theme, setTheme] = useState<'corporate' | 'dracula' | null>(null)

    useEffect(() => {
        const saved = localStorage.getItem("theme") as 'corporate' | 'dracula' | null
        const current = saved || 'corporate'
        document.documentElement.setAttribute("data-theme", current)
        setTheme(current)
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'corporate' ? 'dracula' : 'corporate';
        setTheme(newTheme)
        document.documentElement.setAttribute('data-theme', newTheme)
        localStorage.setItem("theme", newTheme)
    }
    
    return (
        <div>
            <label className="swap swap-rotate">
            <input type="checkbox" onChange={toggleTheme}/>
            {theme === 'dracula' ?
            <Sun className="w-5 h-5"/> :
            <Moon className="w-5 h-5"/>
            }
            </label>
        </div>
    )
}