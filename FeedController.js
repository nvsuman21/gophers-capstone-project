const feedService = require('./FeedService');

class FeedController {
  send(res, status, body) {
    return res.status(status).json(body);
  }

  handleError(res, error, fallbackMessage) {
    if (error?.status) {
      return this.send(res, error.status, error.body || { success: false, message: error.message });
    }
    console.error('[FeedController]', error);
    return this.send(res, 500, { success: false, message: fallbackMessage || 'Internal server error', error: error.message });
  }

  // GET /getAll
  async getAllFeeds(req, res) {
    try {
      const result = await feedService.getAllFeeds({
        page: req.query.page,
        itemsPerPage: req.query.itemsPerPage,
        sortField: req.query.sortField,
        sortOrder: req.query.sortOrder,
        globalSearch: req.query.globalSearch,
      });
      return this.send(res, 200, result);
    } catch (error) {
      return this.handleError(res, error, 'Server error while fetching feeds');
    }
  }

  // POST /add
  async addFeed(req, res) {
    try {
      const result = await feedService.addFeed({
        clerkId: req.auth?.userId,
        body: req.body,
        ip: req.headers['x-forwarded-for'] || req.ip
      });
      return this.send(res, 201, result);
    } catch (error) {
      return this.handleError(res, error, 'Something went wrong!');
    }
  }

  // DELETE /delete/:id
  async deleteFeed(req, res) {
    try {
      const result = await feedService.deleteFeed({
        id: req.params.id,
        clerkId: req.auth?.userId,
        ip: req.headers['x-forwarded-for'] || req.ip
      });
      return this.send(res, 200, result);
    } catch (error) {
      return this.handleError(res, error, 'Failed to delete feed');
    }
  }

  // PUT /update/:id
  async updateFeed(req, res) {
    try {
      const result = await feedService.updateFeed({
        id: req.params.id,
        clerkId: req.auth?.userId,
        body: req.body,
        ip: req.headers['x-forwarded-for'] || req.ip
      });
      return this.send(res, 200, result);
    } catch (error) {
      return this.handleError(res, error, 'Error updating feed');
    }
  }

  // GET /getByUserId
  async getFeedByUserId(req, res) {
    try {
      const result = await feedService.getFeedByUserId({
        clerkId: req.auth?.userId,
        page: req.query.page,
        itemsPerPage: req.query.itemsPerPage,
        sortField: req.query.sortField,
        sortOrder: req.query.sortOrder,
        globalSearch: req.query.globalSearch,
      });
      return this.send(res, 200, result);
    } catch (error) {
      return this.handleError(res, error, 'Internal server error');
    }
  }

  // DELETE /recycle/delete/feeds/:id
  async permanentlyDeleteFeed(req, res) {
    try {
      const result = await feedService.permanentlyDeleteFeed({
        clerkId: req.auth?.userId,
        id: req.params.id,
        ip: req.headers['x-forwarded-for'] || req.ip
      });
      return this.send(res, 200, result);
    } catch (error) {
      return this.handleError(res, error, 'Internal error');
    }
  }
}

module.exports = new FeedController();
