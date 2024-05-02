function maskPhoneNumber(phoneNumber) {
    
    // Сохраняем первые 5 символов и последние 2 символа
    return phoneNumber.slice(0, 5) + '*'.repeat(phoneNumber.length - 7) + phoneNumber.slice(-2);
}
module.exports = {
    maskPhoneNumber,
}