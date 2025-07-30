import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
    const [count, setCount] = useState(0)
    const apiEndpoint = "https://localhost:8888/gateway/urls";
    const [laptops, setLaptops] = useState([])
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const response = await fetch(apiEndpoint)
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                const data = await response.json()
                setURLs(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])
    
    return (
        <>
            <div>
                <a href="https://vite.dev" target="_blank">
                    <img src={viteLogo} className="logo" alt="Vite logo" />
                </a>
                <a href="https://react.dev" target="_blank">
                    <img src={reactLogo} className="logo react" alt="React logo" />
                </a>
            </div>
            <h1>Vite + React</h1>
            
            {/* Display loading state */}
            {isLoading && <p>Loading...</p>}
            
            {/* Display error if any */}
            {error && <p style={{color: 'red'}}>Error: {error}</p>}
            
            {/* Display fetched data */}
            {!isLoading && !error && (
                <div>
                    <h2>URLs ({laptops.length})</h2>
                    {laptops.length > 0 ? (
                        <ul>
                            {laptops.map((item, index) => (
                                <li key={index}>
                                    {JSON.stringify(item)}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No URLs found</p>
                    )}
                </div>
            )}
            
            <div className="card">
                <button onClick={() => setCount((count) => count + 1)}>
                    count is {count}
                </button>
                <p>
                    Edit <code>src/App.jsx</code> and save to test HMR
                </p>
            </div>
            <p className="read-the-docs">
                Click on the Vite and React logos to learn more
            </p>
        </>
    )
}

export default App
