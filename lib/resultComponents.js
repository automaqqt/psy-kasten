/**
 * Result Component Registry
 * Maps test type IDs to their result display components.
 */
import CorsiResults from '../components/results/corsi';
import PVTResults from '../components/results/pvt';
import GNGResults from '../components/results/gng';
import RPMResults from '../components/results/rpm';
import TOLResults from '../components/results/tol';
import VmResults from '../components/results/vm';
import AktResults from '../components/results/akt';
import WtbResults from '../components/results/wtb';
import CPTResults from '../components/results/cpt';
import WcstResults from '../components/results/wcst';

const COMPONENT_MAP = {
  'corsi': CorsiResults,
  'pvt': PVTResults,
  'gng-sst': GNGResults,
  'rpm': RPMResults,
  'tol': TOLResults,
  'vm': VmResults,
  'akt': AktResults,
  'wtb': WtbResults,
  'cpt': CPTResults,
  'wcst': WcstResults,
};

/**
 * Register a new result component.
 * Usage: registerResultComponent('mytest', MyTestResults);
 */
export function registerResultComponent(testType, component) {
  COMPONENT_MAP[testType] = component;
}

/**
 * Get the result component for a given test type.
 */
export function getResultComponent(testType) {
  return COMPONENT_MAP[testType] || null;
}
