const Attachment = require("../models/attachment.model");
const ApiError = require("../utils/ApiError");

const createAttachment = async (payload) => Attachment.create(payload);

const getAttachment = async (id) => {
  const attachment = await Attachment.findById(id).populate("uploaded_by");
  if (!attachment) throw new ApiError(404, "Attachment not found");
  return attachment;
};

module.exports = {
  createAttachment,
  getAttachment,
};

