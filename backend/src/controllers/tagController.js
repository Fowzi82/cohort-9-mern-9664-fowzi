const tagService = require('../services/tagService');
const logger = require('../config/logger');

async function getTags(req, res, next) {
  try {
    const tags = await tagService.getTags(req.user.id);
    res.json(tags);
  } catch (error) {
    next(error);
  }
}

async function createTag(req, res, next) {
  try {
    const tag = await tagService.createTag(req.user.id, req.body?.name);
    logger.info({ userId: req.user.id, tagId: tag.id, tagName: tag.name }, 'Tag created');
    res.status(201).json(tag);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTags,
  createTag,
};
