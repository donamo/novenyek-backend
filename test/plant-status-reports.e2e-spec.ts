import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { createTestApp, TEST_USER_ID } from './helpers/test-app';
import { asUser } from './helpers/gql';
import { cleanupUser, seedTestUser, prisma } from './helpers/db';
import { TEST_USER } from './helpers/test-app';

const CREATE_PLANT = `
  mutation CreatePlant($input: CreatePlantDto!) {
    createPlant(input: $input) { id }
  }
`;

const CREATE_STATUS_REPORT = `
  mutation CreatePlantStatusReport($plantId: ID!, $input: CreatePlantStatusReportDto!) {
    createPlantStatusReport(plantId: $plantId, input: $input) {
      id reportMonth overallStatus leafStatus growthStatus soilStatus
      pestSuspicion wateringAssessment lightAssessment notes aiSummary
    }
  }
`;

const UPDATE_STATUS_REPORT = `
  mutation UpdatePlantStatusReport($plantId: ID!, $id: ID!, $input: UpdatePlantStatusReportDto!) {
    updatePlantStatusReport(plantId: $plantId, id: $id, input: $input) {
      id overallStatus notes
    }
  }
`;

const DELETE_STATUS_REPORT = `
  mutation DeletePlantStatusReport($plantId: ID!, $id: ID!) {
    deletePlantStatusReport(plantId: $plantId, id: $id) { deleted }
  }
`;

const STATUS_REPORTS = `
  query PlantStatusReports($plantId: ID!) {
    plantStatusReports(plantId: $plantId) { id reportMonth overallStatus }
  }
`;

const STATUS_REPORT = `
  query PlantStatusReport($plantId: ID!, $id: ID!) {
    plantStatusReport(plantId: $plantId, id: $id) {
      id reportMonth overallStatus pestSuspicion
    }
  }
`;

describe('Plant Status Reports (e2e)', () => {
  let app: INestApplication;
  let server: App;
  let plantId: string;

  beforeAll(async () => {
    ({ app } = await createTestApp());
    server = app.getHttpServer() as App;
    await seedTestUser(TEST_USER_ID, TEST_USER.email, true, TEST_USER.displayName ?? undefined);

    const res = await asUser(server, TEST_USER_ID).gql(CREATE_PLANT, {
      input: { name: 'Státusz teszt növény' },
    });
    plantId = res.body.data.createPlant.id as string;
  });

  afterAll(async () => {
    await cleanupUser(TEST_USER_ID);
    await prisma.$disconnect();
    await app.close();
  });

  describe('CRUD', () => {
    let reportId: string;

    it('creates a status report with all fields', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(CREATE_STATUS_REPORT, {
        plantId,
        input: {
          reportMonth: '2026-05',
          overallStatus: 'medium',
          leafStatus: 'Néhány alsó levél sárgul.',
          growthStatus: 'Látható új hajtás nincs.',
          soilStatus: 'Felszínen száraz, mélyebben enyhén nedves.',
          pestSuspicion: 'none',
          wateringAssessment: 'Öntözés megfelelőnek tűnik.',
          lightAssessment: 'Több szórt fényt kaphatna.',
          notes: 'Az ablakhoz közelebb lett téve.',
          aiSummary: 'A növény állapota közepesnek tűnik.',
        },
      });
      expect(res.body.errors).toBeUndefined();
      const report = res.body.data.createPlantStatusReport;
      expect(report.reportMonth).toBe('2026-05');
      expect(report.overallStatus).toBe('medium');
      expect(report.pestSuspicion).toBe('none');
      reportId = report.id as string;
    });

    it('creates a status report with only required fields', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(CREATE_STATUS_REPORT, {
        plantId,
        input: { reportMonth: '2026-04' },
      });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.createPlantStatusReport.overallStatus).toBe('unknown');
    });

    it('lists status reports for a plant', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(STATUS_REPORTS, { plantId });
      expect(res.body.errors).toBeUndefined();
      const months = (res.body.data.plantStatusReports as { reportMonth: string }[]).map(
        (r) => r.reportMonth,
      );
      expect(months).toContain('2026-05');
      expect(months).toContain('2026-04');
    });

    it('fetches a single status report by id', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(STATUS_REPORT, { plantId, id: reportId });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.plantStatusReport.reportMonth).toBe('2026-05');
    });

    it('updates a status report', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(UPDATE_STATUS_REPORT, {
        plantId,
        id: reportId,
        input: { overallStatus: 'good', notes: 'Javult az állapot.' },
      });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.updatePlantStatusReport.overallStatus).toBe('good');
    });

    it('rejects duplicate reportMonth for the same plant', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(CREATE_STATUS_REPORT, {
        plantId,
        input: { reportMonth: '2026-05' },
      });
      expect(res.body.errors).toBeDefined();
    });

    it('rejects invalid reportMonth format', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(CREATE_STATUS_REPORT, {
        plantId,
        input: { reportMonth: '05-2026' },
      });
      expect(res.body.errors).toBeDefined();
    });

    it('deletes a status report', async () => {
      const res = await asUser(server, TEST_USER_ID).gql(DELETE_STATUS_REPORT, {
        plantId,
        id: reportId,
      });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.deletePlantStatusReport.deleted).toBe(true);
    });
  });
});
