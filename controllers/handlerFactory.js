const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/api-features');

const getAll = (Model) => {
    return catchAsync(async (req, res, next) => {
        let filters = {};
        if(req.params.tourId) {
            filters = { tour: req.params.tourId };
        }
        const features = new APIFeatures(Model.find(filters), req.query)
                                        .filter()
                                        .sort()
                                        .limit()
                                        .paginate();
    
        // execute the query
        // const docs = await features.query.explain();
        const docs = await features.query;
        res.status(200).json({
            status: 'success',
            results: docs.length,
            data: {
                data: docs
            }
        });
    });
};

const getOne = (Model, populateOptions) => {
    return catchAsync(async (req, res, next) => {
        const id = req.params.id;
        let query = Model.findById(id);
        if(populateOptions) 
            query = query.populate(populateOptions);
        const doc = await query;
        if(!doc) {
            next(new AppError(`Record with id ${id} not found`, 404));
            return;
        }
        res.status(200).json({
            status: 'success',
            data: {
                data: doc
            }
        });
    });
};

const createOne = (Model) => {
    return catchAsync(async (req, res, next) => {
        const newDoc = req.body;
        const createdDoc = await Model.create(newDoc);
        res.status(201).json({
            status: 'success', 
            data: {
                data: createdDoc
            }
        });
    });
};

const updateOne = (Model) => {
    return catchAsync(async (req, res, next) => {
        const id = req.params.id, newData = req.body;
        const updatedDoc = await Model.findByIdAndUpdate(id, newData, {
            new: true,
            runValidators: true
        });
        if(!updatedDoc) {
            next(new AppError(`Record with id ${id} not found`, 404));
            return;
        }
        res.status(200).json({
            status: 'success',
            data: {
                data: updatedDoc
            }
        });
    });
};

const deleteOne = (Model) => {
    return catchAsync(async (req, res, next) => {
        const id = req.params.id;
        const doc = await Model.findByIdAndDelete(id);
        if(!doc) {
            next(new AppError(`Record with id ${id} not found`, 404));
            return;
        }
        res.status(204).json({
            status: 'success',
            data: null
        }); 
    })
};

exports.getAll = getAll;
exports.getOne = getOne;
exports.createOne = createOne;
exports.updateOne = updateOne;
exports.deleteOne = deleteOne;