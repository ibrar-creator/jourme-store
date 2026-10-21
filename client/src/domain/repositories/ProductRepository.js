
/**
 * ProductRepository defines the contract for product data access.
 *
 * Infrastructure layer will provide the actual implementation.
 */
export class ProductRepository {
  async getAll(_filters = {}) {
    throw new Error("getAll() must be implemented by a repository.");
  }

  async getById(_id) {
    throw new Error("getById() must be implemented by a repository.");
  }
}
