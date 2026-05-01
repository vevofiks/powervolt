const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding sample data...');

  // 1. Settings
  await prisma.setting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      companyName: 'Power Volt Electricals',
      companyAddress: '45/2, Industrial Park, Bypass Road, Calicut',
      companyPhone: '9876543210',
      companyEmail: 'info@powervolt.in',
      companyGstin: '32AAAAA0000A1Z5',
      invoicePrefix: 'PV',
      currencySymbol: '₹'
    }
  });

  // 2. Accounts
  const mainCash = await prisma.account.create({
    data: {
      accountName: 'Main Cash',
      openingBalance: 50000,
      currentBalance: 50000,
      notes: 'Primary shop cash'
    }
  });

  const hdfcBank = await prisma.account.create({
    data: {
      accountName: 'HDFC Current A/c',
      bankName: 'HDFC Bank',
      accountNumber: '50200012345678',
      openingBalance: 250000,
      currentBalance: 250000,
      notes: 'Main business account'
    }
  });

  // 3. Products
  const p1 = await prisma.product.create({
    data: {
      productName: 'V-Guard 1.5mm Wire (Red)',
      category: 'WIRES',
      sku: 'VG-15-RED',
      purchasePrice: 1250,
      salePrice: 1480,
      gstPercent: 18,
      stockQty: 50,
      unit: 'Roll'
    }
  });

  const p2 = await prisma.product.create({
    data: {
      productName: 'Legrand 16A Switch',
      category: 'SWITCHES',
      sku: 'LG-16A-SW',
      purchasePrice: 45,
      salePrice: 75,
      gstPercent: 18,
      stockQty: 200,
      unit: 'Nos'
    }
  });

  const p3 = await prisma.product.create({
    data: {
      productName: 'Havells 9W LED Bulb',
      category: 'LIGHTS',
      sku: 'HV-9W-LED',
      purchasePrice: 85,
      salePrice: 140,
      gstPercent: 12,
      stockQty: 15,
      unit: 'Nos',
      lowStockThreshold: 20
    }
  });

  // 4. Staff
  const s1 = await prisma.staff.create({
    data: {
      name: 'Anil Kumar',
      phone: '9988776655',
      role: 'Senior Electrician',
      fullDayRate: 850,
      halfDayRate: 450,
      joinDate: new Date('2023-01-15')
    }
  });

  const s2 = await prisma.staff.create({
    data: {
      name: 'Sunil V',
      phone: '9944332211',
      role: 'Helper',
      fullDayRate: 600,
      halfDayRate: 350,
      joinDate: new Date('2023-05-10')
    }
  });

  // 5. Work Sites
  const site1 = await prisma.workSite.create({
    data: {
      name: 'Skyline Apartment #402',
      clientName: 'Arun George',
      location: 'Kakkanad, Kochi',
      startDate: new Date('2024-03-01'),
      status: 'RUNNING',
      budget: 75000
    }
  });

  // 6. Site Staff Assignment
  await prisma.siteStaff.create({
    data: { workSiteId: site1.id, staffId: s1.id }
  });

  // 7. Some Expenses
  await prisma.expense.create({
    data: {
      title: 'Conduit Pipes for Skyline',
      category: 'MATERIALS',
      amount: 4500,
      date: new Date(),
      accountId: hdfcBank.id,
      workSiteId: site1.id
    }
  });

  // Update account balance
  await prisma.account.update({
    where: { id: hdfcBank.id },
    data: { currentBalance: { decrement: 4500 } }
  });

  // 8. Ledger for Expense
  await prisma.ledgerEntry.create({
    data: {
      accountId: hdfcBank.id,
      type: 'EXPENSE_DEBIT',
      amount: 4500,
      balanceAfter: 245500,
      remark: 'Conduit Pipes for Skyline'
    }
  });

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
