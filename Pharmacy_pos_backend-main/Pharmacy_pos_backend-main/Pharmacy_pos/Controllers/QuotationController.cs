using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pharmacy_pos.Data;
using Pharmacy_pos.Helper;
using Pharmacy_pos.Models;

namespace Pharmacy_pos.Controllers
{
    public class QuotationItemDto
    {
        public int? Id { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal Total { get; set; }
    }

    public class QuotationDto
    {
        public int? Id { get; set; }
        public int CustomerId { get; set; }
        public int UserId { get; set; }
        public decimal? Discount { get; set; } = 0;
        public DateTime QuotationDate { get; set; }
        public string Status { get; set; }
        public List<QuotationItemDto> QuotationItems { get; set; }
    }
    [ApiController]
    [Route("api/[controller]")]
    public class QuotationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<QuotationController> _logger;

        public QuotationController(ApplicationDbContext context, ILogger<QuotationController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Quotation
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                if (!await HelperFunction.HasPermissionAsync(_context, User, "Quotation.Get"))
                    return Forbid("You do not have permission to get Quotations.");
                var quotations = await _context.Quotations
       .Include(q => q.Customer)
       .Include(q => q.User)
       .Include(q => q.QuotationItems)
       .Select(q => new QuotationDto
       {
           Id = q.Id,
           CustomerId = q.Customer.Id,
           UserId = q.User.Id,
           Discount = q.Discount,
           QuotationDate = q.QuotationDate,
           Status = q.Status,
           QuotationItems = q.QuotationItems.Select(qi => new QuotationItemDto
           {
               Id = qi.Id,
               ProductId = qi.ProductId,
               Quantity = qi.Quantity,
               Price = qi.Price,
               Total = qi.Total
           }).ToList()
       })
       .ToListAsync();

                return Ok(quotations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching quotations");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Quotation/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var quotation = await _context.Quotations
                .Include(q => q.Customer)
                .Include(q => q.User)
                .Include(q => q.QuotationItems)
                    .ThenInclude(qi => qi.Product)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (quotation == null)
                return NotFound();

            return Ok(quotation);
        }

        // POST: api/Quotation
        [HttpPost]
        public async Task<IActionResult> Add([FromBody] QuotationDto dto)
        {

            if (!await HelperFunction.HasPermissionAsync(_context, User, "Quotation.Add"))
                return Forbid("You do not have permission to add Quotations.");

            int userid = 0;

            // Get current user id from access token (claims)
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "sub" || c.Type == "userId" || c.Type == "id");
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int currentUserId))
            {
                userid = currentUserId;
            }
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var customer = await _context.Customer.FindAsync(dto.CustomerId);
                var user = await _context.User.FindAsync(userid);

                if (customer == null || user == null)
                    return BadRequest("Invalid customer or user ID.");

                var newQuotation = new Quotation
                {
                    Discount =0,
                    QuotationDate = dto.QuotationDate,
                    Status = dto.Status,
                    Customer = customer,
                    User = user,
                    QuotationItems = dto.QuotationItems.Select(qi => new QuotationItem
                    {
                        ProductId = qi.ProductId,
                        Quantity = qi.Quantity,
                        Price = qi.Price,
                        Total = qi.Total
                    }).ToList()
                };

                _context.Quotations.Add(newQuotation);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return CreatedAtAction(nameof(Edit), new { id = newQuotation.Id }, newQuotation);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error adding quotation");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/Quotation/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Edit(int id, [FromBody] QuotationDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (!await HelperFunction.HasPermissionAsync(_context, User, "Quotation.Edit"))
                    return Forbid("You do not have permission to edit Quotations.");
                //if (id != quotation.Id)
                //    return BadRequest();
               ;
                var existingQuotation = await _context.Quotations
           .Include(q => q.QuotationItems)
           .FirstOrDefaultAsync(q => q.Id == id);

                if (existingQuotation == null)
                    return NotFound();

                // Update main fields
                existingQuotation.Discount =0;
                existingQuotation.QuotationDate = dto.QuotationDate;
                existingQuotation.Status = dto.Status;
                existingQuotation.Customer = await _context.Customer.FindAsync(dto.CustomerId);
                existingQuotation.User = await _context.User.FindAsync(dto.UserId);

                // Remove old items
                _context.QuotationItems.RemoveRange(existingQuotation.QuotationItems);

                // Add new items
                existingQuotation.QuotationItems = dto.QuotationItems.Select(qi => new QuotationItem
                {
                    ProductId = qi.ProductId,
                    Quantity = qi.Quantity,
                    Price = qi.Price,
                    Total = qi.Total
                }).ToList();

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error updating quotation");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
