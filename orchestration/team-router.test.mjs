import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { getActiveTeams, getTeamByID, routeTask } from './team-router.mjs';

async function run() {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'team-router-test-'));

  const registry = {
    version: '1.0',
    teams: [
      {
        id: 'video',
        manager: 'manager-orchestrator',
        status: 'active',
        task_queue: 'orchestration/task-queue.schema.json'
      },
      {
        id: 'school',
        manager: 'manager-school',
        status: 'active',
        task_queue: 'orchestration/school-task-queue.schema.json'
      },
      {
        id: 'email',
        manager: 'manager-email',
        status: 'active',
        task_queue: 'orchestration/email-task-queue.schema.json'
      },
      {
        id: 'discovery',
        manager: 'manager-discovery',
        status: 'active',
        task_queue: 'orchestration/discovery-task-queue.schema.json'
      }
    ]
  };

  await fs.mkdir(path.join(tempRoot, 'orchestration'), { recursive: true });
  await fs.writeFile(
    path.join(tempRoot, 'orchestration/team-registry.json'),
    JSON.stringify(registry, null, 2),
    'utf8'
  );

  process.env.TEAM_REGISTRY_PATH = path.relative(process.cwd(), path.join(tempRoot, 'orchestration/team-registry.json'));

  const expectedTeams = ['video', 'school', 'email', 'discovery'];

  for (const teamID of expectedTeams) {
    const team = await getTeamByID(teamID);
    assert.equal(team?.id, teamID, `Expected to find team ${teamID}`);
  }

  await routeTask('school', { id: 'school-1', status: 'queued', priority: 1 });
  const schoolQueuePath = path.join(tempRoot, 'orchestration/school-task-queue.queue.json');
  const schoolQueue = JSON.parse(await fs.readFile(schoolQueuePath, 'utf8'));
  assert.equal(schoolQueue.length, 1);
  assert.equal(schoolQueue[0].id, 'school-1');
  assert.equal(schoolQueue[0].team, 'school');

  const activeTeams = await getActiveTeams();
  assert.equal(activeTeams.length, 4);

  delete process.env.TEAM_REGISTRY_PATH;
  console.log('team-router tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
