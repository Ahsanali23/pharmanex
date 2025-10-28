using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pharmacy_pos.Data;
using Pharmacy_pos.Models;
using System.Text.Json.Serialization;
namespace Pharmacy_pos.Controllers
{
    // DTOs for input
    public class RoleCreateDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
 
        public List<int> PermissionIds { get; set; }
    }

    public class RoleUpdateDto
    {
        
        public string Name { get; set; }
        public string Description { get; set; }

        public List<int> PermissionIds { get; set; }
    }

    public class PermissionDto
    {
        public string Name { get; set; }
        public string Module { get; set; }
    }
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "SuperAdmin")]
    public class RoleAndPermissionController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<RoleAndPermissionController> _logger;

        public RoleAndPermissionController(ApplicationDbContext context, ILogger<RoleAndPermissionController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Add Role with permissions
        [HttpPost("role")]
        public async Task<IActionResult> AddRole([FromBody] RoleCreateDto dto)
        {
            try
            {
                if (await _context.Roles.AnyAsync(r => r.Name == dto.Name))
                    return BadRequest("Role already exists.");

                var role = new Role
                {
                    Name = dto.Name,
                    Description = dto.Description,
                    RolePermissions = dto.PermissionIds?.Select(pid => new RolePermission { PermissionId = pid }).ToList()
                };
                _context.Roles.Add(role);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Role '{RoleName}' created with ID {RoleId}.", role.Name, role.Id);
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while adding the role '{RoleName}'.", dto.Name);
                return StatusCode(500, $"An error occurred while adding the role: {ex.Message}");
            }
        }

        // Update Role and its permissions
        [HttpPut("role/{id}")]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] RoleUpdateDto dto)
        {
            try
            {
                var role = await _context.Roles
                .Include(r => r.RolePermissions)
                .FirstOrDefaultAsync(r => r.Id == id);
                if (role == null)
                {
                    _logger.LogWarning("Role with ID {RoleId} not found for update.", id);
                    return NotFound();
                }

                role.Name = dto.Name;
                role.Description = dto.Description;

                // Update permissions
                role.RolePermissions.Clear();
                if (dto.PermissionIds != null)
                {
                    foreach (var pid in dto.PermissionIds)
                    {
                        role.RolePermissions.Add(new RolePermission { RoleId = id, PermissionId = pid });
                    }
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation("Role '{RoleName}' (ID: {RoleId}) updated.", role.Name, role.Id);
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while adding the role '{RoleName}'.", dto.Name);
                return StatusCode(500, $"An error occurred while adding the role: {ex.Message}");
            }
        }
        [HttpGet("role")]
        public async Task<IActionResult> GetRoles()
        {
            try
            {
                var roles = await _context.Roles
                    .Include(r => r.RolePermissions)
                        .ThenInclude(rp => rp.Permission)
                    .Select(r => new
                    {
                        r.Id,
                        r.Name,
                        r.Description,
                        Permissions = r.RolePermissions.Select(rp => new
                        {
                            rp.Permission.Id,
                            rp.Permission.Name,
                            rp.Permission.Module
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(roles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching roles.");
                return StatusCode(500, $"An error occurred while fetching roles: {ex.Message}");
            }
        }
        // Add Permission
        [HttpPost("permission")]
        public async Task<IActionResult> AddPermission([FromBody] PermissionDto dto)
        {
            try
            {
                if (await _context.Permission.AnyAsync(p => p.Name == dto.Name))
                {
                    _logger.LogWarning("Permission '{PermissionName}' already exists.", dto.Name);
                    return BadRequest("Permission already exists.");
                }

                var permission = new Permission
                {
                    Name = dto.Name,
                    Module = dto.Module
                };
                _context.Permission.Add(permission);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Permission '{PermissionName}' created with ID {PermissionId}.", permission.Name, permission.Id);
                return Ok(permission);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while adding the role '{RoleName}'.", dto.Name);
                return StatusCode(500, $"An error occurred while adding the role: {ex.Message}");
            }
        }

        // Edit Permission
        [HttpPut("permission/{id}")]
        public async Task<IActionResult> EditPermission(int id, [FromBody] PermissionDto dto)
        {
            try
            {
                var permission = await _context.Permission.FindAsync(id);
                if (permission == null)
                {
                    _logger.LogWarning("Permission with ID {PermissionId} not found for edit.", id);
                    return NotFound();
                }

                permission.Name = dto.Name;
                permission.Module = dto.Module;
                await _context.SaveChangesAsync();
                _logger.LogInformation("Permission '{PermissionName}' (ID: {PermissionId}) updated.", permission.Name, permission.Id);
                return Ok(permission);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while adding the role '{RoleName}'.", dto.Name);
                return StatusCode(500, $"An error occurred while adding the role: {ex.Message}");
            }
        }

        [HttpGet("permission")]
        public async Task<IActionResult> GetPermissions()
        {
            try
            {
                var permissions = await _context.Permission
                    .Select(p => new
                    {
                        p.Id,
                        p.Name,
                        p.Module
                    })
                    .ToListAsync();

                return Ok(permissions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching permissions.");
                return StatusCode(500, $"An error occurred while fetching permissions: {ex.Message}");
            }
        }
    }
}
