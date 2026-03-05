import React from "react";
import { initializeBlock, useBase } from "@airtable/blocks/interface/ui";
import "./style.css";

function App() {
    const base = useBase();

    return (
        <div style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            minHeight: "100vh",
            background: "#f9fafb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚀</div>
                <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0071ce", margin: "0 0 8px" }}>
                    Walmart GG Hackathon
                </h1>
                <p style={{ color: "#6b7280", fontSize: "14px" }}>
                    Connected to: {base.name}
                </p>
            </div>
        </div>
    );
}

initializeBlock({ interface: () => <App /> });
