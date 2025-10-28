using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pharmacy_pos.Data;
using Pharmacy_pos.Helper;

namespace Pharmacy_pos.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProductAndCategoryController> _logger;

        public ReportController(ApplicationDbContext context, ILogger<ProductAndCategoryController> logger)
        {
            _context = context;
            _logger = logger;
        }

        public class ReportResultDto
        {
            public string InvId { get; set; }
            public string Type { get; set; } // "Sale" or "Purchase"
            public DateTime Date { get; set; }
            public decimal TotalAmount { get; set; }
        }
        public class UserSalesReportDto
        {
            public int UserId { get; set; }
            public string UserName { get; set; }
            public int TotalSales { get; set; }
            public decimal TotalAmount { get; set; }
        }

        [HttpGet("searchSaleAndPurchase")]
        public async Task<IActionResult> SearchReport([FromQuery] DateTime from, [FromQuery] DateTime to)
        {
            try
            {
                if (!await HelperFunction.HasPermissionAsync(_context, User, "Report.View"))
                    return Forbid("You do not have permission to view categories.");
                var sales = await _context.Sale
                    .Where(s => s.SaleDate >= from && s.SaleDate <= to)
                    .Select(s => new ReportResultDto
                    {
                        InvId = s.InvoiceNo,
                        Type = "Sale",
                        Date = s.SaleDate,
                        TotalAmount = s.TotalAmount
                    })
                    .ToListAsync();

                var purchases = await _context.Purchase
                    .Where(p => p.PurchaseDate >= from && p.PurchaseDate <= to)
                    .Select(p => new ReportResultDto
                    {
                        InvId = p.InvoiceNo,
                        Type = "Purchase",
                        Date = p.PurchaseDate,
                        TotalAmount = p.TotalAmount
                    })
                    .ToListAsync();

                var result = sales.Concat(purchases)
                    .OrderBy(r => r.Date)
                    .ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while checking permissions.");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("userSalesReport")]
        public async Task<IActionResult> GetUserSalesReport([FromQuery] DateTime from, [FromQuery] DateTime to)
        {
            try
            {
                if (!await HelperFunction.HasPermissionAsync(_context, User, "Report.View"))
                    return Forbid("You do not have permission to view reports.");

                var userSales = await _context.Sale
                    .Where(s => s.SaleDate >= from && s.SaleDate <= to)
                    .GroupBy(s => new { s.UserId, UserName = s.User.Name })
                    .Select(g => new UserSalesReportDto
                    {
                        UserId = g.Key.UserId,
                        UserName = g.Key.UserName,
                        TotalSales = g.Count(),
                        TotalAmount = g.Sum(s => s.TotalAmount)
                    })
                    .ToListAsync();

                return Ok(userSales);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while generating user sales report.");
                return StatusCode(500, "Internal server error");
            }
        }


    }
}
