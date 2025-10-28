using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pharmacy_pos.Data;
using Pharmacy_pos.Helper;
using Pharmacy_pos.Models;

namespace Pharmacy_pos.Controllers
{
    public class SupplierDto
    {
        public string Name { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public string Email { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class SupplierController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SupplierController> _logger;

        public SupplierController(ApplicationDbContext context, ILogger<SupplierController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Supplier
        [HttpGet]
        public async Task<IActionResult> GetSuppliers()
        {
            try
            {
                if (!await HelperFunction.HasPermissionAsync(_context,User,"Supplier.Get"))
                    return Forbid();

                var suppliers = await _context.Supplier.ToListAsync();
                return Ok(suppliers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching suppliers");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Supplier/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSupplier(int id)
        {
            try
            {
                if (! await HelperFunction.HasPermissionAsync(_context,User, "Supplier.Get"))
                    return Forbid();

                var supplier = await _context.Supplier.FindAsync(id);
                if (supplier == null)
                    return NotFound();

                return Ok(supplier);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching supplier");
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/Supplier
        [HttpPost]
        public async Task<IActionResult> AddSupplier([FromBody] SupplierDto dto)
        {
            try
            {
                if (!await HelperFunction.HasPermissionAsync(_context, User, "Supplier.Add"))
                    return Forbid();

                if (dto == null)
                    return BadRequest();

                var supplier = new Supplier
                {
                    Name = dto.Name,
                    Phone = dto.Phone,
                    Address = dto.Address,
                    Email = dto.Email,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Supplier.Add(supplier);
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetSupplier), new { id = supplier.Id }, supplier);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding supplier");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/Supplier/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> EditSupplier(int id, [FromBody] SupplierDto dto)
        {
            try
            {
                if (!await HelperFunction.HasPermissionAsync( _context,User, "Supplier.Edit"))
                    return Forbid();

                if (dto == null )
                    return BadRequest();

                var existingSupplier = await _context.Supplier.FindAsync(id);
                if (existingSupplier == null)
                    return NotFound();

                existingSupplier.Name = dto.Name;
                existingSupplier.Phone = dto.Phone;
                existingSupplier.Address = dto.Address;
                existingSupplier.Email = dto.Email;

                // Update properties (add more as needed)
                _context.Entry(existingSupplier).CurrentValues.SetValues(existingSupplier);
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetSupplier), new { id = id }, existingSupplier);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error editing supplier");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
