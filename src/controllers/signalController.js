'use strict';

const signalService = require('../services/signalService');
const { validateCreateSignal } = require('../validators/signalValidator');
const ApiError = require('../utils/ApiError');

/**
 * HTTP controllers for the signals resource.
 * Responsibilities: parse/validate input, call the service, shape the response.
 * No business logic lives here.
 */

async function create(req, res, next) {
  try {
    const { value, errors } = validateCreateSignal(req.body);
    if (errors.length > 0) {
      throw ApiError.badRequest('Validation failed', errors);
    }
    const signal = await signalService.createSignal(value);
    res.status(201).json({ data: signal });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const signals = await signalService.listSignals();
    res.status(200).json({ data: signals });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const signal = await signalService.getSignalById(req.params.id);
    res.status(200).json({ data: signal });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await signalService.deleteSignal(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function getStatus(req, res, next) {
  try {
    const status = await signalService.getSignalStatus(req.params.id);
    res.status(200).json({ data: status });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getById, remove, getStatus };
