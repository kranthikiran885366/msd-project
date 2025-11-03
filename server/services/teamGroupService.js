const TeamGroup = require('../models/TeamGroup');
const User = require('../models/User');
const { NotFoundError, ValidationError } = require('../utils/errors');

class TeamGroupService {
  async createGroup(data) {
    const group = new TeamGroup(data);
    await group.save();
    return group;
  }

  async getGroupById(groupId) {
    const group = await TeamGroup.findById(groupId)
      .populate('members', 'name email role')
      .populate('createdBy', 'name email');
    
    if (!group) {
      throw new NotFoundError('Team group not found');
    }
    return group;
  }

  async getGroupsByTeam(teamId) {
    return TeamGroup.find({ teamId })
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });
  }

  async updateGroup(groupId, updates) {
    const group = await TeamGroup.findById(groupId);
    if (!group) {
      throw new NotFoundError('Team group not found');
    }

    Object.assign(group, updates);
    await group.save();
    return group;
  }

  async deleteGroup(groupId) {
    const group = await TeamGroup.findById(groupId);
    if (!group) {
      throw new NotFoundError('Team group not found');
    }
    await group.remove();
  }

  async addMembers(groupId, memberIds) {
    const group = await TeamGroup.findById(groupId);
    if (!group) {
      throw new NotFoundError('Team group not found');
    }

    const users = await User.find({ _id: { $in: memberIds } });
    if (users.length !== memberIds.length) {
      throw new ValidationError('One or more users not found');
    }

    group.members = [...new Set([...group.members, ...memberIds])];
    await group.save();
    return group;
  }

  async removeMembers(groupId, memberIds) {
    const group = await TeamGroup.findById(groupId);
    if (!group) {
      throw new NotFoundError('Team group not found');
    }

    group.members = group.members.filter(id => !memberIds.includes(id.toString()));
    await group.save();
    return group;
  }

  async updateGroupPermissions(groupId, permissions) {
    const group = await TeamGroup.findById(groupId);
    if (!group) {
      throw new NotFoundError('Team group not found');
    }

    group.permissions = permissions;
    await group.save();
    return group;
  }
}

module.exports = new TeamGroupService();