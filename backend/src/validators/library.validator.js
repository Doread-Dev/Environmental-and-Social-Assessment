const Joi = require("joi");
const { PLACE_KEYS } = require("../config/places");

// Reference library (D64 b). Places are the keys of config/places.js; locked (v3) places are
// accepted, so their guidance is ready when they open. An empty list = general (Library page only).

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 2000;

const place = Joi.string()
  .valid(...PLACE_KEYS)
  .messages({ "any.only": "Unknown place: {#value}" });
const placeList = Joi.array().items(place).unique().messages({
  "array.unique": "A place is listed twice",
});

// Multipart text fields arrive as strings: "mitigation,management", "" (none), or the field sent
// once per place (an array).
const multipartPlaces = Joi.alternatives()
  .try(placeList, Joi.string().allow(""))
  .custom((value, helpers) => {
    const list = Array.isArray(value)
      ? value
      : value
          .split(",")
          .map((key) => key.trim())
          .filter(Boolean);
    const { error, value: checked } = placeList.validate(list);
    if (error) return helpers.message(error.details[0].message);
    return checked;
  })
  .default([]);

const title = Joi.string().trim().max(TITLE_MAX);
const description = Joi.string().trim().max(DESCRIPTION_MAX).allow("");
const order = Joi.number().integer().min(0);

// POST /library (multipart: file + these fields)
const createLibraryDocumentSchema = Joi.object({
  title: title.required(),
  description: description.default(""),
  places: multipartPlaces,
  order: order.default(0),
});

// PATCH /library/:id (JSON)
const updateLibraryDocumentSchema = Joi.object({
  title,
  description,
  places: placeList,
  order,
}).min(1);

// GET /library
const listLibraryQuerySchema = Joi.object({
  place,
  search: Joi.string().trim().max(100).allow(""),
});

module.exports = {
  createLibraryDocumentSchema,
  updateLibraryDocumentSchema,
  listLibraryQuerySchema,
  DESCRIPTION_MAX,
};
