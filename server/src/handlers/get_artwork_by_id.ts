
import { type GetArtworkByIdInput, type Artwork } from '../schema';

export declare function getArtworkById(input: GetArtworkByIdInput): Promise<Artwork | null>;
