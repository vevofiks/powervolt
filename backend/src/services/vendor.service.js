const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ApiError = require('../utils/ApiError');

class VendorService {
  async createVendor(data) {
    return prisma.vendor.create({
      data: {
        name: data.name,
        phone: data.phone,
        gstNumber: data.gstNumber,
        address: data.address,
        state: data.state,
        email: data.email,
        notes: data.notes,
      },
    });
  }

  async getAllVendors(searchTerm) {
    const where = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm, mode: 'insensitive' } },
            { gstNumber: { contains: searchTerm, mode: 'insensitive' } },
          ],
        }
      : {};

    return prisma.vendor.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getVendorById(id) {
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        purchaseBills: {
          orderBy: { date: 'desc' },
        },
      },
    });
    if (!vendor) {
      throw new ApiError(404, 'Vendor not found');
    }
    return vendor;
  }

  async updateVendor(id, data) {
    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      throw new ApiError(404, 'Vendor not found');
    }

    return prisma.vendor.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        gstNumber: data.gstNumber,
        address: data.address,
        state: data.state,
        email: data.email,
        notes: data.notes,
      },
    });
  }

  async deleteVendor(id) {
    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      throw new ApiError(404, 'Vendor not found');
    }

    // Checking if vendor has any purchase bills
    const purchaseBills = await prisma.purchaseBill.count({
      where: { vendorId: id },
    });

    if (purchaseBills > 0) {
      throw new ApiError(400, 'Cannot delete vendor with existing purchase bills');
    }

    return prisma.vendor.delete({
      where: { id },
    });
  }
}

module.exports = new VendorService();
