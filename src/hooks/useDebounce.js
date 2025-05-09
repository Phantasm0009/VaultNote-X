import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    
    useEffect(() => {
        // Set debouncedValue to value after the specified delay
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        
        // Cancel the timeout if value or delay changes
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);
    
    return debouncedValue;
}

export default useDebounce;