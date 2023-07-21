function getAvailableCurrencies() {
    return ['PLN', 'USD', 'EUR']
}

const ParcelStatues = {
    CREATED: 'CREATED',
    ACCEPTED: 'ACCEPTED',
    PICKED: 'PICKED',
    DELIVERED: 'DELIVERED',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED'
}

module.exports = {
    getAvailableCurrencies, ParcelStatues
}