const BillingContact = require('../models/BillingContact');
const { NotFoundError } = require('../utils/errors');
const emailService = require('./emailService');

class BillingContactService {
  async createContact(data) {
    const contact = new BillingContact(data);
    await contact.save();

    if (contact.isPrimary) {
      await this._notifyPrimaryContactChange(contact);
    }

    return contact;
  }

  async getContactById(contactId) {
    const contact = await BillingContact.findById(contactId);
    if (!contact) {
      throw new NotFoundError('Billing contact not found');
    }
    return contact;
  }

  async getContactsByOrganization(organizationId) {
    return BillingContact.find({ organizationId })
      .sort({ isPrimary: -1, createdAt: -1 });
  }

  async updateContact(contactId, updates) {
    const contact = await BillingContact.findById(contactId);
    if (!contact) {
      throw new NotFoundError('Billing contact not found');
    }

    const wasPrimary = contact.isPrimary;
    Object.assign(contact, updates);
    await contact.save();

    if (!wasPrimary && contact.isPrimary) {
      await this._notifyPrimaryContactChange(contact);
    }

    return contact;
  }

  async deleteContact(contactId) {
    const contact = await BillingContact.findById(contactId);
    if (!contact) {
      throw new NotFoundError('Billing contact not found');
    }

    if (contact.isPrimary) {
      throw new Error('Cannot delete primary billing contact');
    }

    await contact.remove();
  }

  async setPrimaryContact(contactId) {
    const contact = await BillingContact.findById(contactId);
    if (!contact) {
      throw new NotFoundError('Billing contact not found');
    }

    contact.isPrimary = true;
    await contact.save();
    await this._notifyPrimaryContactChange(contact);

    return contact;
  }

  async updateContactPreferences(contactId, preferences) {
    const contact = await BillingContact.findById(contactId);
    if (!contact) {
      throw new NotFoundError('Billing contact not found');
    }

    contact.preferences = { ...contact.preferences, ...preferences };
    await contact.save();
    return contact;
  }

  async _notifyPrimaryContactChange(contact) {
    try {
      await emailService.sendBillingContactUpdate({
        to: contact.email,
        name: contact.name,
        organization: contact.organizationId
      });
    } catch (error) {
      console.error('Failed to send billing contact notification:', error);
      // Don't throw - this is a non-critical operation
    }
  }
}

module.exports = new BillingContactService();