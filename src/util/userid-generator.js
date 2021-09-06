const userIdGenerator = (index) => {
    if (index < 0) return -1;
    let userId = '';
    for (let i = 0; i < 7; i++) {
        userId = String.fromCharCode(index % 26 + 97) + userId;
        index /= 26;
    }
    return userId;
}

module.exports = userIdGenerator;