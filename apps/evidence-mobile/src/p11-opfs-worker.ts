/**
 * OPFS worker for P11 local replicas: opens one replica, or deletes one.
 */
import './p02-opfs-import-meta.ts'
import { runOpfsWorker } from '@viviefs/store-sqlite-wasm'

runOpfsWorker()
