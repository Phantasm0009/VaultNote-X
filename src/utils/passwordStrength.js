export const evaluatePasswordStrength = (passphrase) => {
    const lengthCriteria = passphrase.length >= 12;
    const numberCriteria = /[0-9]/.test(passphrase);
    const uppercaseCriteria = /[A-Z]/.test(passphrase);
    const lowercaseCriteria = /[a-z]/.test(passphrase);
    const specialCharacterCriteria = /[!@#$%^&*(),.?":{}|<>]/.test(passphrase);

    const criteriaMet = [
        lengthCriteria,
        numberCriteria,
        uppercaseCriteria,
        lowercaseCriteria,
        specialCharacterCriteria,
    ].filter(Boolean).length;

    let strength = 'Weak';
    if (criteriaMet >= 4) {
        strength = 'Strong';
    } else if (criteriaMet === 3) {
        strength = 'Moderate';
    }

    return {
        strength,
        criteriaMet,
        feedback: getFeedback(strength),
    };
};

const getFeedback = (strength) => {
    switch (strength) {
        case 'Strong':
            return 'Great job! Your passphrase is strong.';
        case 'Moderate':
            return 'Your passphrase is moderate. Consider adding more complexity.';
        case 'Weak':
        default:
            return 'Your passphrase is weak. Please make it stronger.';
    }
};