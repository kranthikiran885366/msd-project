const teamGroupService = require('../services/teamGroupService');
const { successResponse, errorResponse } = require('../utils/response');

class TeamGroupController {
  async createGroup(req, res, next) {
    try {
      const group = await teamGroupService.createGroup({
        ...req.body,
        createdBy: req.user.id
      });
      res.status(201).json(successResponse(group));
    } catch (error) {
      next(error);
    }
  }

  async getGroup(req, res, next) {
    try {
      const group = await teamGroupService.getGroupById(req.params.groupId);
      res.json(successResponse(group));
    } catch (error) {
      next(error);
    }
  }

  async listGroups(req, res, next) {
    try {
      const groups = await teamGroupService.getGroupsByTeam(req.params.teamId);
      res.json(successResponse(groups));
    } catch (error) {
      next(error);
    }
  }

  async updateGroup(req, res, next) {
    try {
      const group = await teamGroupService.updateGroup(req.params.groupId, req.body);
      res.json(successResponse(group));
    } catch (error) {
      next(error);
    }
  }

  async deleteGroup(req, res, next) {
    try {
      await teamGroupService.deleteGroup(req.params.groupId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }

  async addMembers(req, res, next) {
    try {
      const group = await teamGroupService.addMembers(req.params.groupId, req.body.memberIds);
      res.json(successResponse(group));
    } catch (error) {
      next(error);
    }
  }

  async removeMembers(req, res, next) {
    try {
      const group = await teamGroupService.removeMembers(req.params.groupId, req.body.memberIds);
      res.json(successResponse(group));
    } catch (error) {
      next(error);
    }
  }

  async updatePermissions(req, res, next) {
    try {
      const group = await teamGroupService.updateGroupPermissions(
        req.params.groupId,
        req.body.permissions
      );
      res.json(successResponse(group));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TeamGroupController();