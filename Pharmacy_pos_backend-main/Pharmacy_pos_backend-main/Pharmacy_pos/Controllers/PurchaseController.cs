using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pharmacy_pos.Data;
using Pharmacy_pos.Helper;
using Pharmacy_pos.Models;

namespace Pharmacy_pos.Controllers
{
    public class PurchaseItemDto
    {
        public int ProductId { get; set; }
        //public decimal PurchasePrice { get; set; } // The price at which the product was purchased
        public int Quantity { get; set; }
        public decimal Price { get; set; } // The selling price (if needed, otherwise remove)
        public decimal Total { get; set; }
    }
    public class PurchaseDto
    {
        public int? id { get; set; } = 0;
        public int SupplierId { get; set; }
        public decimal TotalAmount { get; set; }
        public string? InvoiceNo { get; set; } = null;
        public DateTime purchaseDate { get; set; }
        public List<PurchaseItemDto> PurchaseItems { get; set; }
        public decimal Total { get; set; } // If you want a separate total field
    }

    [ApiController]
    [Route("api/[controller]")]
    public class PurchaseController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PurchaseController> _logger;

        public PurchaseController(ApplicationDbContext context, ILogger<PurchaseController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Purchase
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                if (!await HelperFunction.HasPermissionAsync(_context, User, "Purchase.Get"))
                    return Forbid("You do not have permission to get Purchase.");

                var purchases = await _context.Purchase
       .Include(p => p.PurchaseItems)
           .ThenInclude(pi => pi.Product)
       .Include(p => p.Supplier)
       .Include(p => p.User)
       .Select(p => new PurchaseDto
       {
           id= p.Id,
           SupplierId = p.SupplierId,
           TotalAmount = p.TotalAmount,
           InvoiceNo = p.InvoiceNo,
           purchaseDate = p.PurchaseDate,
           Total = p.TotalAmount, // or any other total logic
           PurchaseItems = p.PurchaseItems.Select(pi => new PurchaseItemDto
           {
               ProductId = pi.ProductId,
               Quantity = pi.Quantity,
               Price = pi.Price, // Assuming you have a Price field in PurchaseItem
               Total = pi.Total
           }).ToList()
       })
       .ToListAsync();
                return Ok(purchases);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching purchases");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Purchase/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {

                if (!await HelperFunction.HasPermissionAsync(_context, User, "Purchase.Get"))
                    return Forbid("You do not have permission to get Purchase.");

                var purchase = await _context.Purchase
                        .Include(p => p.PurchaseItems)
                        .ThenInclude(pi => pi.Product)
                        .Include(p => p.Supplier)
                        .Include(p => p.User)
                        .FirstOrDefaultAsync(p => p.Id == id);

                if (purchase == null)
                    return NotFound();

                return Ok(purchase);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching purchase by id");
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/Purchase
        [HttpPost]
        public async Task<IActionResult> Add([FromBody] PurchaseDto dto)
        {
            if (!await HelperFunction.HasPermissionAsync(_context, User, "Purchase.Add"))
                return Forbid("You do not have permission to add Purchase.");

            if (dto == null || dto.PurchaseItems == null || !dto.PurchaseItems.Any())
                return BadRequest("Invalid purchase data");

            int user = 0;

            // Get current user id from access token (claims)
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "sub" || c.Type == "userId" || c.Type == "id");
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int currentUserId))
            {
                user = currentUserId;
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var today = DateTime.UtcNow.Date;
                var todayCount = await _context.Purchase.CountAsync(p => p.PurchaseDate.Date == today);
                var invoiceNo = $"INV-{today:yyyyMMdd}-{todayCount + 1:D4}";
                var purchase = new Purchase
                {
                    SupplierId = dto.SupplierId,
                    UserId = user,
                    TotalAmount = dto.TotalAmount,
                    InvoiceNo = invoiceNo,
                    PurchaseDate = dto.purchaseDate,
                    PurchaseItems = new List<PurchaseItem>()
                };
                //  purchase.PurchaseDate = DateTime.UtcNow;

                //_context.Purchase.Add(purchase);
                //await _context.SaveChangesAsync();

                foreach (var item in dto.PurchaseItems)
                {
                    var purchaseItem = new PurchaseItem
                    {
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        Price = item.Price,
                        Total = item.Total
                    };
                    purchase.PurchaseItems.Add(purchaseItem);

                    var product = await _context.Product.FindAsync(item.ProductId);
                    if (product == null)
                        throw new Exception($"Product {item.ProductId} not found");

                    product.Quantity += item.Quantity;

                    // Adjust product quantity
                    var log = new InventoryLog
                    {
                        ProductId = item.ProductId,
                        ChangeType = "purchase",
                        Quantity = item.Quantity,
                        ReferenceId = purchase.Id,
                        UserId = purchase.UserId,
                        CreatedAt = DateTime.UtcNow,

                        Note = "Purchase log entry"

                    };
                    _context.InventoryLogs.Add(log);
                }

                _context.Purchase.Add(purchase);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(dto);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error adding purchase");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/Purchase/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Edit(int id, [FromBody] PurchaseDto dto)
        {
            if (!await HelperFunction.HasPermissionAsync(_context, User, "Purchase.Edit"))
                return Forbid("You do not have permission to add Purchase.");

            if (dto == null || dto.PurchaseItems == null || !dto.PurchaseItems.Any())
                return BadRequest("Invalid purchase data");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var purchase = await _context.Purchase
                    .Include(p => p.PurchaseItems)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (purchase == null)
                    return NotFound();

                // Build a dictionary of old items for quick lookup
                var oldItemsDict = purchase.PurchaseItems.ToDictionary(i => i.ProductId, i => i);

                // Remove old purchase items and inventory logs, and adjust product quantity
                foreach (var oldItem in purchase.PurchaseItems.ToList())
                {
                    // Adjust product quantity: subtract old quantity
                    var product = await _context.Product.FirstOrDefaultAsync(x => x.Id == oldItem.ProductId);
                    if (product != null)
                    {
                        product.Quantity -= oldItem.Quantity;
                    }

                    // Remove inventory log
                    var log = await _context.InventoryLogs
                        .FirstOrDefaultAsync(l => l.ProductId == oldItem.ProductId && l.ReferenceId == purchase.Id && l.ChangeType == "purchase");
                    if (log != null)
                        _context.InventoryLogs.Remove(log);

                    _context.PurchaseItem.Remove(oldItem);
                }

                // Update purchase fields
                purchase.SupplierId = dto.SupplierId;
                purchase.TotalAmount = dto.TotalAmount;
                //  purchase.UserId = dto.UserId;
                purchase.PurchaseDate = dto.purchaseDate;

                // Add new purchase items and inventory logs, and adjust product quantity
                foreach (var item in dto.PurchaseItems)
                {
                    var newItem = new PurchaseItem
                    {
                        PurchaseId = purchase.Id,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        Price = item.Price,
                        Total = item.Total

                    };
                    _context.PurchaseItem.Add(newItem);

                    // Adjust product quantity: add new quantity
                    var product = await _context.Product.FirstOrDefaultAsync(x => x.Id == item.ProductId);
                    if (product != null)
                    {
                        product.Quantity += item.Quantity;
                    }

                    // Add inventory log
                    var log = new InventoryLog
                    {
                        ProductId = item.ProductId,
                        ChangeType = "purchase",
                        Quantity = item.Quantity,
                        ReferenceId = purchase.Id,
                        UserId = purchase.UserId,

                        CreatedAt = DateTime.UtcNow
                         ,
                        Note = "Purchase log entry"

                    };
                    _context.InventoryLogs.Add(log);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(dto);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error editing purchase");
                return StatusCode(500, "Internal server error");
            }
        }


    }
}
