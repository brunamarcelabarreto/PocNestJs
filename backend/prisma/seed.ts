import { PrismaClient } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.contractField.deleteMany({});
  await prisma.contractTemplate.deleteMany({});
  await prisma.contract.deleteMany({});
  await prisma.templateField.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenant.deleteMany({});

  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
    },
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'TechStart Inc',
      slug: 'techstart-inc',
    },
  });

  const hashedPassword1 = await bcryptjs.hash('Password@123', 10);
  const hashedPassword2 = await bcryptjs.hash('Password@456', 10);
  const hashedPassword3 = await bcryptjs.hash('Password@789', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'admin@user1.com',
      password: hashedPassword1,
      name: 'João Silva',
      role: 'ADMIN',
      tenantId: tenant1.id,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'viewer@user2.com',
      password: hashedPassword2,
      name: 'Joana Oliveira',
      role: 'VIEWER',
      tenantId: tenant1.id,
    },
  });

  console.log('👥 Creating users for TechStart Inc...');
  const user3 = await prisma.user.create({
    data: {
      email: 'admin@user3.com',
      password: hashedPassword3,
      name: 'Maria Santos',
      role: 'ADMIN',
      tenantId: tenant2.id,
    },
  });

  console.log(
    `✅ Created users: ${user1.email} (${user1.role}), ${user2.email} (${user2.role}), ${user3.email} (${user3.role})`,
  );

  const template1 = await prisma.contractTemplate.create({
    data: {
      name: 'Service Agreement',
      version: 1,
      active: true,
      tenantId: tenant1.id,
      fields: {
        create: [
          {
            name: 'Service Description',
            fieldType: 'TEXTAREA',
            required: true,
            order: 1,
          },
          {
            name: 'Monthly Rate',
            fieldType: 'NUMBER',
            required: true,
            order: 2,
          },
          {
            name: 'Start Date',
            fieldType: 'DATE',
            required: true,
            order: 3,
          },
          {
            name: 'End Date',
            fieldType: 'DATE',
            required: false,
            order: 4,
          },
        ],
      },
    },
    include: { fields: true },
  });

  const template2 = await prisma.contractTemplate.create({
    data: {
      name: 'NDA Template',
      version: 1,
      active: true,
      tenantId: tenant2.id,
      fields: {
        create: [
          {
            name: 'Company Name',
            fieldType: 'TEXT',
            required: true,
            order: 1,
          },
          {
            name: 'Contact Email',
            fieldType: 'EMAIL',
            required: true,
            order: 2,
          },
          {
            name: 'Confidential Information',
            fieldType: 'TEXTAREA',
            required: true,
            order: 3,
          },
        ],
      },
    },
    include: { fields: true },
  });


  const contract1 = await prisma.contract.create({
    data: {
      title: 'Service Agreement - CT-2025-001',
      status: 'ACTIVE',
      templateId: template1.id,
      tenantId: tenant1.id,
      createdBy: user1.id,
      fields: {
        create: [
          {
            fieldId: template1.fields[0].id,
            value: 'Software development services for web application',
          },
          {
            fieldId: template1.fields[1].id,
            value: '5000',
          },
          {
            fieldId: template1.fields[2].id,
            value: '2025-01-15',
          },
        ],
      },
    },
  });

  const contract2 = await prisma.contract.create({
    data: {
      title: 'Cloud Infrastructure - CT-2025-002',
      status: 'ACTIVE',
      templateId: template1.id,
      tenantId: tenant1.id,
      createdBy: user1.id,
      fields: {
        create: [
          {
            fieldId: template1.fields[0].id,
            value: 'Cloud infrastructure support',
          },
          {
            fieldId: template1.fields[1].id,
            value: '3000',
          },
          {
            fieldId: template1.fields[2].id,
            value: '2025-02-01',
          },
        ],
      },
    },
  });

  const contract3 = await prisma.contract.create({
    data: {
      title: 'Consulting Services - CT-2025-003',
      status: 'DRAFT',
      templateId: template1.id,
      tenantId: tenant1.id,
      createdBy: user1.id,
      fields: {
        create: [
          {
            fieldId: template1.fields[0].id,
            value: 'Consulting services for process optimization',
          },
          {
            fieldId: template1.fields[1].id,
            value: '2500',
          },
          {
            fieldId: template1.fields[2].id,
            value: '2025-03-01',
          },
        ],
      },
    },
  });

  const contract4 = await prisma.contract.create({
    data: {
      title: 'NDA Agreement - CT-2025-004',
      status: 'ACTIVE',
      templateId: template2.id,
      tenantId: tenant2.id,
      createdBy: user3.id,
      fields: {
        create: [
          {
            fieldId: template2.fields[0].id,
            value: 'SecureVault Inc',
          },
          {
            fieldId: template2.fields[1].id,
            value: 'legal@securevault.com',
          },
          {
            fieldId: template2.fields[2].id,
            value: 'All proprietary code, algorithms, and business strategies',
          },
        ],
      },
    },
  });

  const contract5 = await prisma.contract.create({
    data: {
      title: 'Data Processing Agreement - CT-2025-005',
      status: 'CLOSED',
      templateId: template2.id,
      tenantId: tenant2.id,
      createdBy: user3.id,
      fields: {
        create: [
          {
            fieldId: template2.fields[0].id,
            value: 'DataFlow Systems',
          },
          {
            fieldId: template2.fields[1].id,
            value: 'contracts@dataflow.com',
          },
          {
            fieldId: template2.fields[2].id,
            value: 'Technical specifications and customer data',
          },
        ],
      },
    },
  });

  console.log(
    `✅ Created contracts: CT-2025-001 to CT-2025-005 (3 for Tenant 1, 2 for Tenant 2)`,
  );


  await prisma.auditLog.create({
    data: {
      action: 'CONTRACT_CREATED',
      description: 'Contract created and activated',
      contractId: contract1.id,
      userId: user1.id,
      tenantId: tenant1.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'CONTRACT_ACTIVATED',
      description: 'Contract status changed to ACTIVE',
      fieldName: 'status',
      oldValue: 'DRAFT',
      newValue: 'ACTIVE',
      contractId: contract1.id,
      userId: user1.id,
      tenantId: tenant1.id,
    },
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
