const billingContactService = require('../services/billingContactService');
const { successResponse, errorResponse } = require('../utils/response');

class BillingContactController {
  async createContact(req, res, next) {
    try {
      const contact = await billingContactService.createContact({
        ...req.body,
        organizationId: req.params.organizationId
      });
      res.status(201).json(successResponse(contact));
    } catch (error) {
      next(error);
    }
  }

  async getContact(req, res, next) {
    try {
      const contact = await billingContactService.getContactById(req.params.contactId);
      res.json(successResponse(contact));
    } catch (error) {
      next(error);
    }
  }

  async listContacts(req, res, next) {
    try {
      const contacts = await billingContactService.getContactsByOrganization(
        req.params.organizationId
      );
      res.json(successResponse(contacts));
    } catch (error) {
      next(error);
    }
  }

  async updateContact(req, res, next) {
    try {
      const contact = await billingContactService.updateContact(
        req.params.contactId,
        req.body
      );
      res.json(successResponse(contact));
    } catch (error) {
      next(error);
    }
  }

  async deleteContact(req, res, next) {
    try {
      await billingContactService.deleteContact(req.params.contactId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }

  async setPrimaryContact(req, res, next) {
    try {
      const contact = await billingContactService.setPrimaryContact(req.params.contactId);
      res.json(successResponse(contact));
    } catch (error) {
      next(error);
    }
  }

  async updatePreferences(req, res, next) {
    try {
      const contact = await billingContactService.updateContactPreferences(
        req.params.contactId,
        req.body.preferences
      );
      res.json(successResponse(contact));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BillingContactController();