import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function resolveRegistryPath() {
  const registryPath = process.env.TEAM_REGISTRY_PATH ?? 'orchestration/team-registry.json';
  return path.resolve(repoRoot, registryPath);
}

function resolveMemoryPath(teamID) {
  const memoryDir = process.env.TEAM_MEMORY_DIR ?? 'memory';
  const filenameByTeam = {
    video: 'context.json',
    school: 'school-context.json',
    email: 'email-context.json',
    discovery: 'discovery-context.json'
  };

  const memoryFile = filenameByTeam[teamID];
  if (!memoryFile) {
    return null;
  }

  return path.resolve(repoRoot, memoryDir, memoryFile);
}

function resolveQueuePath(team, registryPath) {
  const registryDir = path.dirname(registryPath);
  const schemaPath = path.resolve(registryDir, '..', team.task_queue);
  if (schemaPath.endsWith('.schema.json')) {
    return schemaPath.replace('.schema.json', '.queue.json');
  }
  return schemaPath;
}

async function readJSON(filePath, fallbackValue = null) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return fallbackValue;
    }
    throw error;
  }
}

async function writeJSON(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function getRegistry() {
  const registryPath = resolveRegistryPath();
  const registry = await readJSON(registryPath);

  if (!registry || !Array.isArray(registry.teams)) {
    throw new Error(`Invalid team registry at ${registryPath}`);
  }

  return {
    ...registry,
    registryPath
  };
}

export async function getTeamByID(id) {
  const { teams } = await getRegistry();
  return teams.find((team) => team.id === id) ?? null;
}

export async function routeTask(teamID, task) {
  const { teams, registryPath } = await getRegistry();
  const team = teams.find((candidate) => candidate.id === teamID) ?? null;
  if (!team) {
    throw new Error(`Unknown teamID: ${teamID}`);
  }

  const queuePath = resolveQueuePath(team, registryPath);
  const queue = await readJSON(queuePath, []);
  if (!Array.isArray(queue)) {
    throw new Error(`Task queue is not an array: ${queuePath}`);
  }

  const queuedTask = {
    ...task,
    team: team.id,
    queued_at: new Date().toISOString()
  };

  queue.push(queuedTask);
  await writeJSON(queuePath, queue);

  return { queuePath, task: queuedTask };
}

export async function getActiveTeams() {
  const { teams } = await getRegistry();
  return teams.filter((team) => team.status === 'active');
}

export async function getTeamStatus(teamID) {
  const { teams, registryPath } = await getRegistry();
  const team = teams.find((candidate) => candidate.id === teamID) ?? null;
  if (!team) {
    throw new Error(`Unknown teamID: ${teamID}`);
  }

  const memoryPath = resolveMemoryPath(teamID);
  const memory = memoryPath ? await readJSON(memoryPath, {}) : {};

  const queuePath = resolveQueuePath(team, registryPath);
  const queue = await readJSON(queuePath, []);
  const activeTasks = Array.isArray(queue)
    ? queue.filter((task) => task.status !== 'done' && task.status !== 'completed')
    : [];

  return {
    team,
    memory,
    activeTasks
  };
}

async function runCLI() {
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    const teams = await getActiveTeams();
    console.log(JSON.stringify(teams, null, 2));
    return;
  }

  if (args.includes('--status')) {
    const teamID = args.find((arg) => !arg.startsWith('--'));
    if (teamID) {
      const status = await getTeamStatus(teamID);
      console.log(JSON.stringify(status, null, 2));
      return;
    }

    const activeTeams = await getActiveTeams();
    const statuses = await Promise.all(activeTeams.map((team) => getTeamStatus(team.id)));
    console.log(JSON.stringify(statuses, null, 2));
  }
}

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectExecution) {
  runCLI().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
