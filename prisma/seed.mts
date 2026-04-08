import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.tag.createMany({
    data: [
      {
        id: '4452656d-9fa4-4bd0-ba38-70492e31d180',
        name: 'EMERGENCY_FUND'
      },
      {
        id: 'f2e868af-8333-459f-b161-cbc6544c24bd',
        name: 'EXCLUDE_FROM_ANALYSIS'
      }
    ],
    skipDuplicates: true
  });

  // Bootstrap super admin mapped to Authentik admin account
  const authentikAdminSub = process.env.AUTHENTIK_ADMIN_SUB;

  if (authentikAdminSub) {
    await prisma.user.upsert({
      where: {
        provider_thirdPartyId: {
          provider: 'OIDC',
          thirdPartyId: authentikAdminSub
        }
      },
      update: {},
      create: {
        provider: 'OIDC',
        thirdPartyId: authentikAdminSub,
        role: 'ADMIN'
      }
    });

    console.log(
      `Upserted bootstrap super admin with thirdPartyId: ${authentikAdminSub}`
    );
  } else {
    console.log(
      'AUTHENTIK_ADMIN_SUB not set — skipping bootstrap super admin seed'
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
