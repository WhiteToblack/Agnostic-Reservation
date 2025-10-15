using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgnosticReservation.Application.Abstractions;
using AgnosticReservation.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace AgnosticReservation.Api.Controllers;

[ApiController]
[Route("api/resources")]
public class ResourcesController : ControllerBase
{
    private readonly IRepository<Resource> _resourceRepository;

    public ResourcesController(IRepository<Resource> resourceRepository)
    {
        _resourceRepository = resourceRepository;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Resource>>> Get([FromQuery] Guid tenantId, CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
        {
            return BadRequest("TenantId is required");
        }

        var resources = await _resourceRepository.ListAsync(r => r.TenantId == tenantId, cancellationToken);
        return Ok(resources);
    }
}
