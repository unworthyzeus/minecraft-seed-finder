import { BTREE_1_18 } from './btree_1_18.js';
import { BTREE_1_19 } from './btree_1_19.js';
import { BTREE_1_20 } from './btree_1_20.js';
import { BTREE_BEDROCK_1_21_WD } from './btree_bedrock_1_21_wd.js';
import { BTREE_BEDROCK_26_20 } from './btree_bedrock_26_20.js';

export function getBedrockBiomeTree(profile) {
    switch (profile?.biomeTreeKey) {
        case 'btree18':
            return BTREE_1_18;
        case 'btree19':
            return BTREE_1_19;
        case 'btree20':
            return BTREE_1_20;
        case 'btree21wd':
            return BTREE_BEDROCK_1_21_WD;
        case 'btree262':
            return BTREE_BEDROCK_26_20;
        default:
            return null;
    }
}
