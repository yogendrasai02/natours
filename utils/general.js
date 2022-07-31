exports.filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(field => {
        if(allowedFields.includes(field)) {
            newObj[field] = obj[field];
        }
    });
    return newObj;
};

exports.milesToKM = mi => mi * 1.60934;
exports.kmToMiles = km => km * 0.621371;
exports.milesToRadians = mi => mi / 3960;
exports.kmToRadians = km => km / 6371;