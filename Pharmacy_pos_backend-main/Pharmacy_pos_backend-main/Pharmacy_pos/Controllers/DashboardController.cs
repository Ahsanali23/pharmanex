using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pharmacy_pos.Data;

namespace Pharmacy_pos.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(ApplicationDbContext context, ILogger<DashboardController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Helper: Get date range
        private (DateTime start, DateTime end) GetDateRange(string filter, DateTime? from, DateTime? to)
        {
            var today = DateTime.UtcNow.Date;
            return filter switch
            {
                "weekly" => (today.AddDays(-7), today.AddDays(1)),
                "monthly" => (today.AddMonths(-1), today.AddDays(1)),
                "custom" when from.HasValue && to.HasValue => (from.Value.Date, to.Value.Date.AddDays(1)),
                _ => (today, today.AddDays(1))
            };
        }

        [HttpGet("summary-cards")]
        public async Task<IActionResult> GetSummaryCards([FromQuery] string filter = "weekly", [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
        {
            try
            {
                var (start, end) = GetDateRange(filter, from, to);

                // Total Purchases (number of purchases/orders)
                var saleAmount = await _context.Sale
                    .Where(p => EF.Property<DateTime>(p, "SaleDate") >= start && EF.Property<DateTime>(p, "SaleDate") < end)
                    .SumAsync(p => (decimal?)p.TotalAmount) ?? 0;

                // Purchase Amount (sum of TotalAmount in purchases)
                var purchaseAmount = await _context.Purchase
                    .Where(p => EF.Property<DateTime>(p, "PurchaseDate") >= start && EF.Property<DateTime>(p, "PurchaseDate") < end)
                    .SumAsync(p => (decimal?)p.TotalAmount) ?? 0;

                // Total Users
                var totalUsers = await _context.User.CountAsync();

                // Total Suppliers
                var totalSuppliers = await _context.Supplier.CountAsync();

                // Example progress values (replace with real logic if needed)
                var purchasesProgress = 50;
                var purchaseAmountProgress = 70;
                var usersProgress = 80;
                var suppliersProgress = 40;

                var cards = new[]
                {
                    new {
                        title = "Sale Amount",
                        amount = saleAmount.ToString("N0"),
                        progress = new { value = purchasesProgress },
                        color = "bg-azure-50"
                    },
                    new {
                        title = "Purchase Amount",
                        amount = purchaseAmount.ToString("N0"),
                        progress = new { value = purchaseAmountProgress },
                        color = "bg-blue-50"
                    },
                    new {
                        title = "Total Users",
                        amount = totalUsers.ToString("N0"),
                        progress = new { value = usersProgress },
                        color = "bg-green-50"
                    },
                    new {
                        title = "Total Suppliers",
                        amount = totalSuppliers.ToString("N0"),
                        progress = new { value = suppliersProgress },
                        color = "bg-cyan-50"
                    }
                };

                return Ok(cards);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching summary cards");
                return StatusCode(500, "Internal server error");
            }
        }
        [HttpGet("sales-purchase-chart")]
        public async Task<IActionResult> GetSalesPurchaseChart([FromQuery] string filter = "weekly", [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
        {
            try
            {
                var (start, end) = GetDateRange(filter, from, to);

                // Determine interval and label format
                int intervalHours;
                string labelFormat;
                int pointsCount = 7;
                if (filter == "monthly")
                {
                    intervalHours = 24 * 4; // every 4 days
                    labelFormat = "yyyy-MM-dd";
                }
                else if (filter == "custom" && from.HasValue && to.HasValue && (to.Value - from.Value).TotalDays > 14)
                {
                    intervalHours = 24 * ((int)Math.Ceiling((to.Value - from.Value).TotalDays / (pointsCount - 1)));
                    labelFormat = "yyyy-MM-dd";
                }
                else
                {
                    intervalHours = 24; // daily for weekly/default
                    labelFormat = "yyyy-MM-dd";
                }

                var categories = new List<string>();
                var saleData = new List<decimal>();
                var purchaseData = new List<decimal>();

                for (int i = 0; i < pointsCount; i++)
                {
                    var rangeStart = start.AddHours(i * intervalHours);
                    var rangeEnd = (i == pointsCount - 1) ? end : start.AddHours((i + 1) * intervalHours);

                    categories.Add(rangeStart.ToString("yyyy-MM-ddTHH:mm:ss"));

                    var salesSum = await _context.Sale
                        .Where(s => s.SaleDate >= rangeStart && s.SaleDate < rangeEnd)
                        .SumAsync(s => (decimal?)s.TotalAmount) ?? 0;
                    saleData.Add(salesSum);

                    var purchaseSum = await _context.Purchase
                        .Where(p => p.PurchaseDate >= rangeStart && p.PurchaseDate < rangeEnd)
                        .SumAsync(p => (decimal?)p.TotalAmount) ?? 0;
                    purchaseData.Add(purchaseSum);
                }

                var chartData = new
                {
                    chart = new
                    {
                        height = 350,
                        type = "area",
                        toolbar = new { show = false },
                        zoom = new { enabled = false }
                    },
                    dataLabels = new { enabled = false },
                    stroke = new { curve = "smooth" },
                    series = new[]
                    {
                        new { name = "Sale", data = saleData },
                        new { name = "Purchase", data = purchaseData }
                    },
                    xaxis = new
                    {
                        type = "datetime",
                        categories = categories
                    },
                    tooltip = new
                    {
                        x = new { format = "dd/MM/yy HH:mm" }
                    },
                    legend = new
                    {
                        position = "top",
                        horizontalAlign = "right"
                    }
                };

                return Ok(chartData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching sales-purchase chart data");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("monthly-category-sales-donut")]
        public async Task<IActionResult> GetMonthlyCategorySalesDonut()
        {
            try
            {
                // Get the first and last day of the current month (UTC)
                var today = DateTime.UtcNow.Date;
                var monthStart = new DateTime(today.Year, today.Month, 1);
                var monthEnd = monthStart.AddMonths(1);

                // Query sale items in the current month, group by category
                var categorySales = await _context.SaleItem
                    .Where(si => si.Sale.SaleDate >= monthStart && si.Sale.SaleDate < monthEnd)
                    .Include(si => si.Product).ThenInclude(p => p.Category)
                    .GroupBy(si => si.Product.Category.Name)
                    .Select(g => new
                    {
                        Category = g.Key,
                        SaleCount = g.Sum(si => si.Quantity)
                    })
                    .OrderByDescending(x => x.SaleCount)
                    .ToListAsync();

                // Prepare data for donut chart
                var labels = categorySales.Select(x => x.Category).ToArray();
                var data = categorySales.Select(x => x.SaleCount).ToArray();

                var chartData = new
                {
                    chart = new
                    {
                        type = "donut",
                        height = 350
                    },
                    labels = labels,
                    series = data,
                    legend = new
                    {
                        position = "bottom"
                    },
                    plotOptions = new
                    {
                        pie = new
                        {
                            donut = new
                            {
                                size = "65%"
                            }
                        }
                    },
                    colors = new[] { "#008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0", "#3F51B5", "#546E7A" }
                };

                return Ok(chartData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching monthly category sales donut chart data");
                return StatusCode(500, "Internal server error");
            }
        }
        [HttpGet("monthly-sales-by-salesmen")]
        public async Task<IActionResult> GetMonthlySalesBySalesmen([FromQuery] string filter = "weekly", [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
        {
            try
            {
                var (start, end) = GetDateRange(filter, from, to);
                // Get the first and last day of the current month (UTC)
                var today = DateTime.UtcNow.Date;


                // Query sales in the current month, group by user (salesman)
                var salesByUser = await _context.Sale
                    .Where(s => s.SaleDate >= start && s.SaleDate < end)
                    .GroupBy(s => s.User)
                    .Select(g => new
                    {
                        Salesman = g.Key.Name,
                        TotalSales = g.Sum(s => s.TotalAmount)
                    })
                    .OrderByDescending(x => x.TotalSales)
                    .ToListAsync();

                var categories = salesByUser.Select(x => x.Salesman).ToArray();
                var data = salesByUser.Select(x => x.TotalSales).ToArray();

                var chartData = new
                {
                    series = new[]
                    {
                        new
                        {
                            name = "Sales",
                            data = data
                        }
                    },
                    chart = new
                    {
                        type = "bar",
                        height = 350
                    },
                    xaxis = new
                    {
                        categories = categories
                    },
                    title = new
                    {
                        text = ""
                    }
                };

                return Ok(chartData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching monthly sales by salesmen");
                return StatusCode(500, "Internal server error");
            }
        }
        [HttpGet("low-stock-products")]
        public async Task<IActionResult> GetLowStockProducts()
        {
            try
            {
                var lowStockProducts = await _context.Product
                    .Where(p => p.Quantity <= p.AlertQuantity)
                    .Select(p => new
                    {
                        p.Id,
                        p.Name,
                        p.Quantity,
                        p.Unit,
                        Category = p.Category != null ? p.Category.Name : null
                    })
                    .OrderBy(p => p.Quantity)
                    .ToListAsync();

                return Ok(lowStockProducts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching low stock products");
                return StatusCode(500, "Internal server error");
            }
        }
        [HttpGet("today-purchase")]
        public async Task<IActionResult> GetTodayPurchase()
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                var tomorrow = today.AddDays(1);

                var todayPurchases = await _context.Purchase
                    .Where(p => p.PurchaseDate >= today && p.PurchaseDate < tomorrow)
                    .Select(p => new
                    {
                        p.Id,
                        p.InvoiceNo,
                        p.PurchaseDate,
                        Supplier = p.Supplier != null ? p.Supplier.Name : null,
                        User = p.User != null ? p.User.Name : null,
                        ItemsCount = p.PurchaseItems != null ? p.PurchaseItems.Count : 0,
                        p.TotalAmount

                    })
                    .OrderByDescending(p => p.PurchaseDate)
                    .ToListAsync();

                return Ok(todayPurchases);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching today's purchases");
                return StatusCode(500, "Internal server error");
            }
        }
        [HttpGet("today-sales")]
        public async Task<IActionResult> GetTodaySales()
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                var tomorrow = today.AddDays(1);

                var todaySales = await _context.Sale
                    .Where(s => s.SaleDate >= today && s.SaleDate < tomorrow)
                    .Select(s => new
                    {
                        s.Id,
                        s.InvoiceNo,
                        s.SaleDate,
                        Customer = s.Customer != null ? s.Customer.Name : null,
                        User = s.User != null ? s.User.Name : null,
                        ItemsCount = s.SaleItems != null ? s.SaleItems.Count : 0,
                        s.TotalAmount
                    })
                    .OrderByDescending(s => s.SaleDate)
                    .ToListAsync();

                return Ok(todaySales);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching today's sales");
                return StatusCode(500, "Internal server error");
            }
        }


    }
}
