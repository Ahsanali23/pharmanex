using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pharmacy_pos.Data;
using Pharmacy_pos.Helper;
using Pharmacy_pos.Models;

namespace Pharmacy_pos.Controllers
{
    public class saleItemDto
    {
        public int ProductId { get; set; }
        //public decimal PurchasePrice { get; set; } // The price at which the product was purchased
        public int Quantity { get; set; }
        public decimal Price { get; set; } // The selling price (if needed, otherwise remove)
        public decimal Total { get; set; }
    }
    public class saleDto
    {
        public int CustomerId { get; set; }
        public decimal TotalAmount { get; set; }
        public string? InvoiceNo { get; set; } = null;
        public string? Status { get; set; } = "paid";

        public DateTime salesDate { get; set; }
        public List<saleItemDto> salesItems { get; set; }
        public decimal Total { get; set; } // If you want a separate total field
    }
    public class Salefect
    {
        public int? Id { get; set; } // Optional
        public int CustomerId { get; set; }
        public int UserId { get; set; }
        public decimal TotalAmount { get; set; }
        public string InvoiceNo { get; set; }
        public DateTime PurchaseDate { get; set; }
        public List<SaleItemfect> Items { get; set; } = new List<SaleItemfect>();
    }

    public class SaleItemfect
    {
        public int? Id { get; set; } // Optional
        public int? SaleId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal Total { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class SalesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SalesController> _logger;

        public SalesController(ApplicationDbContext context, ILogger<SalesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Permission check helper (replace with your actual permission logic)


        [HttpGet("{id}")]
        public async Task<IActionResult> GetSale(int id)
        {
            // if (!await HelperFunction.HasPermissionAsync(_context, User, "Sale.Get"))
            // return Forbid("You do not have permission to add sale.");

            try
            {
                var sale = await _context.Sale
       .Include(p => p.SaleItems)
           .ThenInclude(pi => pi.Product)
       .Include(p => p.Customer)
       .Include(p => p.User)
       .Select(p => new saleDto
       {
           CustomerId = p.CustomerId,
           TotalAmount = p.TotalAmount,
           InvoiceNo = p.InvoiceNo,
           salesDate = p.SaleDate,
           Status=p.Status,
           Total = p.TotalAmount, // or any other total logic
           salesItems = p.SaleItems.Select(pi => new saleItemDto
           {
               ProductId = pi.ProductId,
               Quantity = pi.Quantity,
               Price = pi.Price, // Assuming you have a Price field in PurchaseItem
               Total = pi.Total
           }).ToList()
       })
       .ToListAsync();
                return Ok(sale);

                ;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching sale with id {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddSale([FromBody] saleDto dto)
        {
            if (!await HelperFunction.HasPermissionAsync(_context, User, "Sale.Add"))
                return Forbid("You do not have permission to add sale.");

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

                // Validate sale and items
                if (dto == null || dto.salesItems == null || !dto.salesItems.Any())
                    return BadRequest("Invalid sale data.");
                var today = DateTime.UtcNow.Date;
                var todayCount = await _context.Sale.CountAsync(p => p.SaleDate.Date == today);
                var invoiceNo = $"INV-{today:yyyyMMdd}-{todayCount + 1:D4}";
                var sale = new Sale
                {
                    CustomerId = dto.CustomerId,
                    UserId = user,
                    TotalAmount = dto.TotalAmount,
                    InvoiceNo = invoiceNo,
                    SaleDate = dto.salesDate,
                    Status = dto.Status ?? "paid",
                    SaleItems = new List<SaleItem>()
                };
                foreach (var item in dto.salesItems)
                {
                    var purchaseItem = new SaleItem
                    {
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        Price = item.Price,
                        Total = item.Total
                    };
                    sale.SaleItems.Add(purchaseItem);

                    var product = await _context.Product.FindAsync(item.ProductId);
                    if (product == null)
                        throw new Exception($"Product {item.ProductId} not found");

                    product.Quantity -= item.Quantity;

                    // Adjust product quantity
                    var log = new InventoryLog
                    {
                        ProductId = item.ProductId,
                        ChangeType = "sales",
                        Quantity = item.Quantity,
                        ReferenceId = sale.Id,
                        UserId = sale.UserId,
                        CreatedAt = DateTime.UtcNow,
                        Note = "testing"
                    };
                    _context.InventoryLogs.Add(log);
                }

                _context.Sale.Add(sale);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(dto);
              
             
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error adding sale");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> EditSale(int id, [FromBody] saleDto dto)
        {
            if (!await HelperFunction.HasPermissionAsync(_context, User, "Sale.Add"))
                return Forbid("You do not have permission to edit sale.");
            if (dto == null || dto.salesItems == null || !dto.salesItems.Any())
                return BadRequest("Invalid purchase data");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var sale = await _context.Sale
                  .Include(p => p.SaleItems)
                  .FirstOrDefaultAsync(p => p.Id == id);

                if (sale == null)
                    return NotFound();

                // Build a dictionary of old s for quick lookup
                var oldItemsDict = sale.SaleItems.ToDictionary(i => i.ProductId, i => i);
                foreach (var oldItem in sale.SaleItems.ToList())
                {
                    // Adjust product quantity: subtract old quantity
                    var product = await _context.Product.FirstOrDefaultAsync(x => x.Id == oldItem.ProductId);
                    if (product != null)
                    {
                        product.Quantity += oldItem.Quantity;
                    }

                    // Remove inventory log
                    var log = await _context.InventoryLogs
                        .FirstOrDefaultAsync(l => l.ProductId == oldItem.ProductId && l.ReferenceId == sale.Id && l.ChangeType == "purchase");
                    if (log != null)
                        _context.InventoryLogs.Remove(log);

                    _context.SaleItem.Remove(oldItem);
                }
                // Update purchase fields
                sale.CustomerId = dto.CustomerId;
                sale.TotalAmount = dto.TotalAmount;
                sale.Status = dto.Status?? "paid";
                //  purchase.UserId = dto.UserId;
                sale.SaleDate = dto.salesDate;
                foreach (var item in dto.salesItems)
                {
                    var newItem = new SaleItem
                    {
                        SaleId = sale.Id,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        Price = item.Price,
                        Total = item.Total
                    };
                    _context.SaleItem.Add(newItem);

                    // Adjust product quantity: add new quantity
                    var product = await _context.Product.FirstOrDefaultAsync(x => x.Id == item.ProductId);
                    if (product != null)
                    {
                        product.Quantity -= item.Quantity;
                    }

                    // Add inventory log
                    var log = new InventoryLog
                    {
                        ProductId = item.ProductId,
                        ChangeType = "sale",
                        Quantity = item.Quantity,
                        ReferenceId = sale.Id,
                        UserId = sale.UserId,
                        CreatedAt = DateTime.UtcNow,
                        Note = "testing"
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
                _logger.LogError(ex, "Error editing sale with id {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }
        [HttpGet]
        [HttpGet]
        public async Task<IActionResult> GetSales()
        {
            if (!await HelperFunction.HasPermissionAsync(_context, User, "Sale.Get"))
                return Forbid("You do not have permission to view sales.");

            try
            {
                var sales = await _context.Sale
                    .Include(s => s.SaleItems)
                    .Select(s => new Salefect
                    {
                        Id = s.Id,
                        CustomerId = s.CustomerId,
                        UserId = s.UserId,
                        TotalAmount = s.TotalAmount,
                        InvoiceNo = s.InvoiceNo,
                        PurchaseDate = s.SaleDate,
                        Items = s.SaleItems.Select(si => new SaleItemfect
                        {
                            Id = si.Id,
                            SaleId = si.SaleId,
                            ProductId = si.ProductId,
                            Quantity = si.Quantity,
                            Price = si.Price,
                            Total = si.Total
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(sales);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching sales list");
                return StatusCode(500, "Internal server error");
            }
        }
        [HttpPost("{id}/return")]
        public async Task<IActionResult> ReturnSale(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (!await HelperFunction.HasPermissionAsync(_context, User, "Sale.Add"))
                    return Forbid("You do not have permission to edit sale.");
                var sale = await _context.Sale
                    .Include(s => s.SaleItems)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (sale == null)
                    return NotFound();

                if (sale.Status == "Returned")
                    return BadRequest("Sale is already returned.");

                foreach (var item in sale.SaleItems)
                {
                    var product = await _context.Product.FindAsync(item.ProductId);
                    if (product != null)
                    {
                        product.Quantity += item.Quantity;
                    }

                    var log = new InventoryLog
                    {
                        ProductId = item.ProductId,
                        ChangeType = "return",
                        Quantity = item.Quantity,
                        ReferenceId = sale.Id,
                        UserId = sale.UserId,
                        CreatedAt = DateTime.UtcNow,
                        Note = "Sale returned"
                    };
                    _context.InventoryLogs.Add(log);
                }

                sale.Status = "Returned";
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok("Sale returned successfully.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error returning sale with id {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSale(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var sale = await _context.Sale
                    .Include(s => s.SaleItems)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (sale == null)
                    return NotFound();

                foreach (var item in sale.SaleItems)
                {
                    var product = await _context.Product.FindAsync(item.ProductId);
                    if (product != null)
                    {
                        product.Quantity += item.Quantity;
                    }

                    var log = await _context.InventoryLogs
                        .FirstOrDefaultAsync(l => l.ProductId == item.ProductId && l.ReferenceId == sale.Id && l.ChangeType == "sales");
                    if (log != null)
                        _context.InventoryLogs.Remove(log);
                }

                _context.Sale.Remove(sale);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok("Sale deleted successfully.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error deleting sale with id {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }

    }
}
