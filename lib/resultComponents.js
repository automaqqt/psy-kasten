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
import BartResults from '../components/results/bart';
import TmtResults from '../components/results/tmt';
import StbResults from '../components/results/stb';
import PalResults from '../components/results/pal';
import NbackResults from '../components/results/nback';
import PrltResults from '../components/results/prlt';
import MotResults from '../components/results/mot';
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
  'bart': BartResults,
  'tmt': TmtResults,
  'stb': StbResults,
  'pal': PalResults,
  'nback': NbackResults,
  'prlt': PrltResults,
  'mot': MotResults,
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
