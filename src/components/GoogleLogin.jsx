import { useState, useEffect } from "react";

// Google Client ID from environment variables
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleLogin({ onLoginSuccess, onLogout }) {
    const [user, setUser] = useState(null);
    const [sdkReady, setSdkReady] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [scanLine, setScanLine] = useState(0);
}
