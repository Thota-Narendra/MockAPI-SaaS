import React, { useState, useEffect } from 'react';

const API_WS_URL = 'ws://localhost:8000/ws/logs'; // Connects to Manager API

const RequestLog = ({ projectSlug }) => {
    const [logs, setLogs] = useState([]);
    const [status, setStatus] = useState('Connecting...');

    useEffect(() => {
        const ws = new WebSocket(API_WS_URL);

        ws.onopen = () => {
            setStatus('Live: Waiting for requests...');
        };

        ws.onmessage = (event) => {
            try {
                // We receive a JSON string from Redis, so we must parse it
                const newLog = JSON.parse(event.data);

                // Only show logs relevant to the current project slug
                if (newLog.project_slug === projectSlug) {
                    setLogs((prevLogs) => [newLog, ...prevLogs].slice(0, 50)); // Keep only the last 50
                }
            } catch (e) {
                console.error("Failed to parse log message:", e);
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket Error:", error);
            setStatus('Error: Check backend and Redis connection.');
        };

        ws.onclose = () => {
            setStatus('Disconnected. Trying to reconnect...');
            // In a real app, you would add a timeout/reconnect logic here
        };

        // Cleanup function to close the WebSocket when the component unmounts
        return () => {
            ws.close();
        };
    }, [projectSlug]);

    return (
        <div style={{ marginTop: '2rem', border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', background: '#f9f9f9' }}>
            <h3 style={{ marginTop: 0 }}>
                Live Request Inspector <span style={{ float: 'right', fontSize: '0.9rem', color: status.startsWith('Live') ? 'green' : 'red' }}>{status}</span>
            </h3>
            <div style={{ maxHeight: '400px', overflowY: 'scroll', background: 'white', padding: '10px' }}>
                {logs.length === 0 ? (
                    <p style={{ color: '#888' }}>No requests received for this project yet.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {logs.map((log, index) => (
                            <li key={index} style={{ borderBottom: '1px dotted #eee', padding: '8px 0', fontFamily: 'monospace', fontSize: '0.85rem', color: log.status >= 400 ? 'red' : 'inherit' }}>
                                <span style={{ fontWeight: 'bold', marginRight: '10px', background: log.status >= 400 ? '#fdd' : '#dfd', padding: '2px 5px', borderRadius: '4px' }}>{log.status}</span>
                                <span style={{ fontWeight: 'bold', marginRight: '10px' }}>{log.method}</span>
                                <span>{log.path}</span>
                                <span style={{ float: 'right', color: '#999' }}>{new Date(log.timestamp * 1000).toLocaleTimeString()}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default RequestLog;