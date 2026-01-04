/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */

function calculateSimpleRevenue(purchase, _product) {
    const { discount, sale_price, quantity } = purchase;

    const discountDecimal = discount / 100;
    const totalPrice = sale_price * quantity;
    const revenue = totalPrice * (1 - discountDecimal);

    return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */

function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    let bonus;
    if (index === 0) {
        bonus = profit * 0.15;
    } else if (index === 1 || index === 2) {
        bonus = profit * 0.10;
    } else if (index === total - 1) {
        bonus = 0;
    } else {
        bonus = profit * 0.05;
    }

    return bonus
}

const options = {
    calculateRevenue: calculateSimpleRevenue,
    calculateBonus: calculateBonusByProfit
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */

function analyzeSalesData(data, options) {
    const { calculateRevenue, calculateBonus} = options;

    if (
        !data ||
        !Array.isArray(data.products) ||
        !Array.isArray(data.sellers) ||
        !Array.isArray(data.purchase_records) ||
        data.products.length === 0 ||
        data.sellers.length === 0 ||
        data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }


    if (
        typeof calculateRevenue !== 'function' ||
        typeof calculateBonus !== 'function' ||
        typeof options !== 'object' ||
        options === null
    ) {
        throw new Error('Чего-то не хватает');
    }


    const sellerStats = data.sellers.map(seller => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    bonus: 0,
    salesCount: 0,
    profit: 0,
    products_sold: {},
    top_products: []
    })); 

    const sellerIndex = sellerStats.reduce((acc, seller) => ({
        ...acc,
        [seller.id]: seller
    }), {});
    const productIndex = data.products.reduce((acc, product) => ({
        ...acc,
        [product.sku]: product
    }), {})


    data.purchase_records.forEach(record => { 
        const seller = sellerIndex[record.seller_id]; 
        seller.salesCount += 1;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            const revenue = calculateRevenue(item, product);
            const cost = product.purchase_price * item.quantity;
            const profit = revenue - cost;

            seller.revenue += revenue;
            seller.profit += profit;

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }

            seller.products_sold[item.sku] += item.quantity;
        });
    }); 

    sellerStats.sort((a, b) => b.profit - a.profit)

    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);
        seller.top_products = Object.entries(seller.products_sold)
        .map(([sku, quantity]) => ({ sku, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    }) 

    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.salesCount,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    })); 

}
