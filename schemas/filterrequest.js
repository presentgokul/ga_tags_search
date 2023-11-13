const Joi = require('joi');
exports.filterSearchSchema = Joi.object({
    filter: Joi.string().required(),
    request_id: Joi.string().required(),
    description: Joi.string().optional().allow(''),
    user_id: Joi.string(),
    filters_match_mode: Joi.string().required(),
    filters_logic: Joi.string().required(),
    timestamp: Joi.number().min(1)
  });
