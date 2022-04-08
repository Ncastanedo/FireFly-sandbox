import { Get, JsonController, QueryParam } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { firefly } from '../clients/firefly';
import { Organization, Verifier } from '../interfaces';

/**
 * Common Operations - API Server
 */
@JsonController('/common')
@OpenAPI({ tags: ['Common'] })
export class CommonController {
  @Get('/organizations')
  @ResponseSchema(Organization, { isArray: true })
  @OpenAPI({ summary: 'List all organizations in network' })
  async organizations(@QueryParam('exclude_self') exclude_self: boolean): Promise<Organization[]> {
    let orgs = await firefly.getOrganizations();
    if (exclude_self) {
      const status = await firefly.getStatus();
      orgs = orgs.filter((o) => o.id !== status.org.id);
    }
    return orgs.map((o) => ({ id: o.id, did: o.did, name: o.name }));
  }

  @Get('/organizations/self')
  @ResponseSchema(Organization)
  @OpenAPI({ summary: 'Look up local organization' })
  async self(): Promise<Organization> {
    const status = await firefly.getStatus();
    return { id: status.org.id, did: status.org.did, name: status.org.name };
  }

  @Get('/verifiers')
  @ResponseSchema(Verifier, { isArray: true })
  @OpenAPI({ summary: 'List verifiers (such as Ethereum keys) for all organizations in network' })
  async verifiers(): Promise<Verifier[]> {
    const orgs = await firefly.getOrganizations();
    const verifiers = await firefly.getVerifiers('ff_system');
    const result: Verifier[] = [];
    for (const v of verifiers) {
      const o = orgs.find((o) => o.id === v.identity);
      if (o !== undefined) {
        result.push({ did: o.did, type: v.type, value: v.value });
      }
    }
    return result;
  }
}
