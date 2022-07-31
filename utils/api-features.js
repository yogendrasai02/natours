class APIFeatures {

    constructor(query, queryObjectFromClient) {
        this.query = query;
        this.queryObjectFromClient = queryObjectFromClient;
    }

    // ** FILTERING **
    filter() {
        // get the query object and delete some fields
        let queryObj = {...this.queryObjectFromClient};
        
        const fieldsToExclude = ['sort', 'page', 'limit', 'fields'];
        fieldsToExclude.forEach(field => {
            delete queryObj[field];
        });

        // add the $ sign before 'gte', 'gt', 'lt', 'lte' operators
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        queryObj = JSON.parse(queryStr);
        
        // build the query
        this.query = this.query.find(queryObj);

        return this;
    }

    // *** SORTING ***
    sort() {
        if(this.queryObjectFromClient.sort) {
            // split multiple sort fields by ',' and join then using ' '
            const sortBy = this.queryObjectFromClient.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            // sort in desc order of 'createdAt', so that the latest ones come first
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }

    // *** LIMITING FIELDS ***
    limit() {
        if(this.queryObjectFromClient.fields) {
            // split and join by ' '
            const fields = this.queryObjectFromClient.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        }
        this.query = this.query.select('-__v');   // dont send the __v field in response
        return this;
    }

    // *** PAGINATION ***
    paginate() {
        const page = this.queryObjectFromClient.page || 1;
        const limit = this.queryObjectFromClient.limit || 10000;

        const skipValue = (page - 1) * limit;

        this.query = this.query.skip(skipValue).limit(limit);
        return this;
    }

}

module.exports = APIFeatures;