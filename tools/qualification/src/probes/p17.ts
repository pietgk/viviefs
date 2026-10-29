import { refuseUnrunProbe } from './not-yet-run.ts'

refuseUnrunProbe('P17', 'Only one browser tab runs the workflow engine; killing the leader promotes the follower.')
